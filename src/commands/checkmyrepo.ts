import getDirPath from "../helpers/getDirPath";
import { execSync } from "child_process";
import chalk from "chalk";

export default function checkMyRepo() {
  const gitDirPath = getDirPath();
  if (!gitDirPath) return;

  const authorChanges = new Map();

  const commits = new Set(
    execSync(`git log --pretty=format:"%H"`).toString().split("\n")
  );

  commits.forEach((commitHash) => {
    const commitStats = execSync(
      `git show ${commitHash} --shortstat --pretty=format:"%an <%ae>"`
    ).toString();

    const [author, statData] = commitStats.trim().split("\n ");

    const numAuthorCommitChanges = statData
      .split(", ")
      .slice(1)
      .map((statString) => parseInt(statString.split(" ")[0]))
      .reduce((a, b) => a + b);

    const prevNumChanges = authorChanges.get(author);
    if (prevNumChanges)
      authorChanges.set(author, prevNumChanges + numAuthorCommitChanges);
    else authorChanges.set(author, numAuthorCommitChanges);
  });

  let sum = 0;
  Array.from(authorChanges).forEach(([_, numChanges]) => (sum += numChanges));

  const statResult = Array.from(authorChanges)
    .map(([author, numChanges]) => {
      const percentage = parseFloat(
        Math.fround((numChanges / sum) * 100).toFixed(2)
      );

      return [author, percentage];
    })
    .sort((a, b) => b[1] - a[1])
    .map(([author, codeEquity]) => [author, `${codeEquity}%`]);

  console.log("Contribooters of this Repo:");
  statResult.forEach(([author, codeEquity]) => {
    console.log(
      `    Author: ${chalk.magenta(
        author
      )} owns Code Equity: ${chalk.blueBright(codeEquity)}`
    );
  });
}
