#
# *   merge master to feat-x
# |\
# | * master2 
# | * master1
# * | x2 <-- expected!!
# * | x1
# |/
# * first commit

cd test
rm -rf fixtures/master-to-catch-up-branch
git init
git commit --allow-empty -m "first commit"
sleep 1s
git checkout -b feat-x
git commit --allow-empty -m "x1"
sleep 1s
git commit --allow-empty -m "x2"
sleep 1s
git tag "expected"
git checkout master
git commit --allow-empty -m "master1"
sleep 1s
git commit --allow-empty -m "master2"
sleep 1s
git checkout -b master2x feat-x
git merge master -m "merge master to master2x"
sleep 1s

echo "==================== master-to-catch-up-branch ===================="
git show-branch -a --sha1-name

mv .git fixtures/master-to-catch-up-branch
rm -rf .git