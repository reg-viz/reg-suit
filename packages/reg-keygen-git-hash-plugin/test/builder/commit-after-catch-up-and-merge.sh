# * [feat-x] x3
#  ! [feat-y] merge master to feat-y
#   ! [master] master2
# ---
# *   x3
# * + master2
# --  merge master to feat-y
# *++ master1

# * (HEAD -> feat-x) x3
# *   merge master to feat-x
# |\
# | *  (master) master2
# * |    merge feat-y to feat-x
# |\ \
# | * \   (tag: expected, feat-y) merge master to feat-y
# | |\ \
# | | |/
# | | *  master1
# * | | x2
# |/ /
# * | x1
# |/
# * first commit

cd test
rm -rf fixtures/commit-after-catch-up-and-merge
git init
cat << EOF > .gitignore
/builder
/fixtures
EOF
git add ".gitignore" && git commit --allow-empty -m "first commit"
sleep 1s
git checkout -b feat-x
git commit --allow-empty -m "x1"
sleep 1s
git checkout -b feat-y
git checkout master
cat << EOF > README.md
0
EOF
git add "README.md" && git commit -m "master1"
sleep 1s
git checkout feat-y
git merge --no-ff -m "merge master to feat-y" master
sleep 1s
git tag "expected"
git checkout master
cat << EOF > README.md
0
1
EOF
git add "README.md" && git commit -m "master2"
sleep 1s
git checkout feat-x
git commit --allow-empty -m "x2"
sleep 1s
git merge --no-ff -m "merge feat-y to feat-x" feat-y
sleep 1s
git merge --no-ff -m "merge master to feat-x" master
sleep 1s
git commit --allow-empty -m "x3"

echo "==================== commit-after-catch-up-and-merge ===================="
git show-branch -a --sha1-name

mv .git fixtures/commit-after-catch-up-and-merge
rm -rf README.md
rm -rf .gitignore
rm -rf .git