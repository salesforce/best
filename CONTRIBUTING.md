# Contributing

## Editor Configurations

Configuring your editor to use our lint and code style rules will help make the
code review process delightful!

### eslint

[Configure your editor][eslint-integrations] to use our `ESLint` configurations.

### editorconfig

[Configure your editor][editorconfig-plugins] to use our editor configurations.

### Visual Studio Code

```
ext install EditorConfig
```

## Git Workflow

The process of submitting a pull request is fairly straightforward and
generally follows the same pattern each time:

1. [Create a feature branch](#create-a-feature-branch)
1. [Make your changes](#make-your-changes)
1. [Rebase](#rebase)
1. [Check your submission](#check-your-submission)
1. [Create a pull request](#create-a-pull-request)
1. [Update the pull request](#update-the-pull-request)

### Create a feature branch

```bash
git checkout master
git pull origin master
git checkout -b <name-of-the-feature>
```

### Make your changes

Modify the files, build, test, lint and eventually commit your code using the following command:

```bash
git add <path/to/file/to/commit>
git commit
git push origin <name-of-the-feature>
```

The above commands will commit the files into your feature branch. You can keep
pushing new changes into the same branch until you are ready to create a pull
request.

### Rebase

Sometimes your feature branch will get stale with respect to the master branch,
and it will require a rebase. The following steps can help:

```bash
git checkout master
git pull origin master
git checkout <name-of-the-feature>
git rebase master <name-of-the-feature>
```

_note: If no conflicts arise, these commands will ensure that your changes are applied on top of the master branch. Any conflicts will have to be manually resolved._

### Check your submission

#### Lint your changes

```bash
yarn run lint
```

The above command may display lint issues that are unrelated to your changes.
The recommended way to avoid lint issues is to [configure your
editor][eslint-integrations] to warn you in real time as you edit the file.

Fixing all existing lint issues is a tedious task so please pitch in by fixing
the ones related to the files you make changes to!

#### Run tests

```sh
yarn test
```

### Create a pull request

If you've never created a pull request before, follow [these
instructions][creating-a-pull-request].

### Update the pull request

```sh
git fetch origin
git rebase origin/${base_branch}

# If there were no merge conflicts in the rebase
git push origin ${feature_branch}

# If there was a merge conflict that was resolved
git push origin ${feature_branch} --force
```

_note: If more changes are needed as part of the pull request, just keep committing and pushing your feature branch as described above and the pull request will automatically update._

<!-- Link labels: -->

[creating-a-pull-request]: https://help.github.com/en/articles/creating-a-pull-request
[editorconfig-plugins]: https://editorconfig.org/#download
[eslint-integrations]: https://eslint.org/docs/user-guide/integrations
