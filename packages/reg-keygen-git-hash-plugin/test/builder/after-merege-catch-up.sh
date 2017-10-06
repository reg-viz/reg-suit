cd test
rm -rf fixtures/after-merge-catch-up
git init
git commit --allow-empty -m "first commit"
sleep 1s
git commit --allow-empty -m "second commit"
sleep 1s
git checkout -b feat-x
git commit --allow-empty -m "x1"
sleep 1s
git commit --allow-empty -m "x2"
sleep 1s
git checkout master
git commit --allow-empty -m "master1"
sleep 1s
git commit --allow-empty -m "master2"
git tag "expected"
sleep 1s
git checkout feat-x
git checkout -b master2feat-x
git merge master --no-ff -m "merge master to master2feat-x"
git checkout feat-x
git merge master2feat-x --no-ff -m "merge master2feat-x to feat-x"

echo "==================== after-merge-catch-up ===================="
git show-branch -a --sha1-name

mv .git fixtures/after-merge-catch-up
rm -rf .git

