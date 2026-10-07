# Contribuer

1. `main` est toujours jouable. On ne pousse jamais directement dessus.
2. Crée une branche par tâche : `git switch -c feature/nom-court` (ex. `feature/capture-animation`).
3. Commits petits et clairs, en français ou en anglais, mais de façon cohérente.
4. Avant de pousser : `git pull --rebase origin main`, puis `npm run build` doit passer.
5. Ouvre une Pull Request, un autre membre la relit et la merge.
6. Reste dans ton dossier quand c'est possible. Si tu dois modifier le dossier de quelqu'un d'autre, préviens-le.
