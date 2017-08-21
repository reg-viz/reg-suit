cd test
rm -rf fixtures/master-two-commits
git init
git commit --allow-empty -m "first commit"
git commit --allow-empty -m "two commit"

echo "==================== master-two-commit ===================="
git show-branch -a --sha1-name

mv .git fixtures/master-two-commits
rm -rf .git