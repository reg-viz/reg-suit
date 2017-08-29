cd test
rm -rf fixtures/detached-head
git init
git commit --allow-empty -m "first commit"
sleep 1s
git commit --allow-empty -m "second commit"
sleep 1s
git checkout HEAD^
mv .git fixtures/detached-head
rm -rf .git