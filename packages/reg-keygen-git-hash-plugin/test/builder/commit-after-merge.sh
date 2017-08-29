cd test

rm -rf fixtures/commit-after-merge
git init
git commit --allow-empty -m "first commit"
sleep 1s
git commit --allow-empty -m "second commit"
sleep 1s
git checkout -b feat-x
git checkout master
git commit --allow-empty -m "x1"
sleep 1s
git commit --allow-empty -m "x2"
sleep 1s
git checkout master
git commit --allow-empty -m "master1"
sleep 1s
git tag "expected"
git checkout feat-x
git merge master --no-ff -m "merge master to feat-x"
sleep 1s
git commit --allow-empty -m "x3"

echo "==================== commit-after-merge ===================="
git show-branch -a --sha1-name

mv .git fixtures/commit-after-merge
rm -rf .git