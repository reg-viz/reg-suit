cd test
rm -rf fixtures/merge-multipe-commit-three
git init
git commit --allow-empty -m "init import"
sleep 1s
git checkout -b branch1
git commit --allow-empty -m "branch1 commit"
git tag "expected"
sleep 1s
git checkout master
git checkout -b branch2
git commit --allow-empty -m "branch2 commit"
sleep 1s
git checkout master
git checkout -b branch3
git commit --allow-empty -m "branch3 commit"
sleep 1s
git checkout master
git merge --no-ff branch1 branch2 branch3 -m "merge branch11 branch2 branch3 to master"

echo "==================== merge-multipe-commit-three ===================="
git show-branch -a --sha1-name

mv .git fixtures/merge-multipe-commit-three
rm -rf .git
