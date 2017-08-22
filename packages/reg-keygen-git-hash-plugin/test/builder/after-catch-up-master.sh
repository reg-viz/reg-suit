# *   merge master to feat-x
# |\
# | * master1  <-- expected
# * | x2
# * | x1
# |/
# * second commit
# * first commit

# *   aca0da9 merge master to feat-x
# |\
# | * 5ebe771 master1
# * | deecf0e x2
# * | 95867ad x1
# |/
# * 30c203c second commit
# * faed570 first commit


cd test
rm -rf fixtures/after-catch-up-master
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
git tag "expected"
git checkout feat-x
git merge master --no-ff -m "merge master to feat-x"

echo "==================== after-catch-up-master ===================="
git show-branch -a --sha1-name

mv .git fixtures/after-catch-up-master
rm -rf .git

