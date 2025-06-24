# Contributing

We highly appreciate your contributions to the project ❤️

## Main flow

### Step 1 — get code

```shell
git clone git@github.com:ton-org/blueprint.git
cd blueprint
git checkout -b name-of-your-feature origin/develop
```

### Step 2 — write code

Write the code for your change, test it locally, then commit

> Git history: work log vs recipe https://www.bitsnbites.eu/git-history-work-log-vs-recipe/
Use [Conventional Commits](https://www.conventionalcommits.org/)

```shell
git commit --message "feat: paypal payment for different users"
```

or

```shell
git commit --message "fix: hide password display when searching for a user"
```

### Step 3 — make a fork

Go [here](https://github.com/ton-org/blueprint/fork) to make a fork, then setup your remote:

```bash
git remote add self url_of_your_fork
```

### Step 4 — make a pull request

Push:

```shell
git push --set-upstream self name-of-your-feature
```

Then create a pull request from the [pull requests page](https://github.com/ton-org/blueprint/pulls) or directly:

```shell
https://github.com/ton-org/blueprint/pull/new/name-of-your-feature
```
(note the name of your branch in the URL)

### Step 5 — update your branch from main

This step may be necessary in case the `main`/`develop` branch has changed since you created your branch

> [!NOTE]
> A tidy, linear Git history  https://www.bitsnbites.eu/a-tidy-linear-git-history/

Get the latest upstream changes and update the working branch:

```shell
git fetch --prune origin
git rebase --autostash --ignore-date origin/main
```
> [!WARNING]
> Please note that you get the current state of the `main` branch from the **origin** remote for pushing to your own branch

During the rebase, there may be conflicts, they need to be resolved; once the conflicts are resolved, you can continue the rebase:

```shell
git rebase --continue
```

Upload the updated working branch to the repository; given that we changed the history, this should be done with the force option:

```shell
git push --force --set-upstream self name-of-your-feature
```

More details can be found in the tutorial: [git rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

## All set 🎉

Thanks for your time and code!
