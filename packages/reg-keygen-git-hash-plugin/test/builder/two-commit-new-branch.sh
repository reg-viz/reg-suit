cd test
rm -rf fixtures/two-commit-new-branch
git init
git commit --allow-empty -m "first commit"
sleep 1s
git checkout -b feat-x
git checkout master
git commit --allow-empty -m "second commit"
sleep 1s
git tag "expected"
git checkout feat-x
git commit --allow-empty -m "x1"
sleep 1s
git commit --allow-empty -m "x2"
sleep 1s
git commit --allow-empty -m "x3"
sleep 1s
git merge master --no-ff -m "merge master to feat-x"
git checkout master
git checkout -b feat-y
git commit --allow-empty -m "y1"
sleep 1s
git commit --allow-empty -m "y2"

echo "==================== two-commit-new-branch ===================="
git show-branch -a --sha1-name

mv .git fixtures/two-commit-new-branch
rm -rf .git