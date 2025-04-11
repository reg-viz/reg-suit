cd test
rm -rf fixtures/conflict-short-git-object-id .git
git init


git checkout -b master 2>/dev/null || git checkout master
git commit --allow-empty -m "initial commit"
total_commits=0
while true; do
branch_name="branch--$((total_commits + 1))"
  git checkout -b "$branch_name"
  git commit --allow-empty -m "commit $((++total_commits))"
  git checkout master
  git merge "$branch_name" --no-ff -m "merge $branch_name"

  if git log --abbrev=4 --pretty=%h | awk 'length($0) > 4' | grep -q .; then
    echo "🎯 Collision detected after $total_commits commits"
    git checkout "$branch_name"
    break
  fi
done

mv .git fixtures/conflict-short-git-object-id
rm -rf .git