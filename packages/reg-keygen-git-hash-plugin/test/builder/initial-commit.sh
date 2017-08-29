cd test
rm -rf fixtures/initial-commit
git init
git commit --allow-empty -m "first commit"
mv .git fixtures/initial-commit
rm -rf .git