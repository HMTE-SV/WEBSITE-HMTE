#!/usr/bin/env bash
#
# Mengembalikan kepemilikan riwayat commit ke pemilik repo.
#
# Dua hal dikerjakan dalam satu kali jalan:
#
# 1. Author & committer "Codex <codex@example.local>" ditulis ulang menjadi
#    identitas GitHub yang sebenarnya. GitHub mengisi contribution graph
#    berdasarkan EMAIL AUTHOR commit, bukan akun yang melakukan push. Email
#    placeholder itu tidak terhubung ke akun mana pun, jadi 66 commit sejak
#    31 Mei tidak pernah masuk heatmap.
#
# 2. Trailer "Co-Authored-By: Claude ..." dibuang dari pesan commit. Arahan
#    dan keputusan datang dari pemilik repo; trailer itu memunculkan entri
#    kontributor tambahan yang tidak mewakili siapa pun.
#
# Tanggal asli commit dipertahankan, jadi kotak heatmap jatuh di tanggal
# aslinya (31 Mei sampai 1 Agustus 2026), bukan menumpuk di hari ini.
#
# Cadangan sudah dibuat sebelum skrip ini dijalankan:
#   - bundle : D:/Agentic-Project/WEBSITE-HMTE/_backup-git/WEBSITE-HMTE-sebelum-rewrite-2026-08-01.bundle
#   - tag    : backup/pre-rewrite/<nama-branch>  (10 branch)
# filter-branch juga menyimpan ref lama di refs/original/ secara otomatis.

set -euo pipefail

NAMA_BARU="Made Reeyza"
EMAIL_BARU="hexdev.aizen@gmail.com"
EMAIL_LAMA="codex@example.local"

cd "$(dirname "$0")/.."
AKAR="$(pwd)"

echo "== Sebelum =="
printf 'commit ber-author placeholder : %s\n' "$(git rev-list --branches --author="$EMAIL_LAMA" --count)"
printf 'commit dengan trailer AI      : %s\n' "$(git log --branches --format='%b' | grep -ci 'co-authored-by:.*anthropic' || true)"

# Hanya perubahan pada berkas yang sudah ter-track yang menghalangi rewrite.
# Berkas untracked tidak jadi masalah dan tidak perlu ikut diblokir.
if ! git diff-index --quiet HEAD --; then
  echo
  echo "BATAL: ada perubahan belum ter-commit pada berkas ter-track:"
  git diff-index --name-only HEAD --
  echo "Commit atau stash dulu, lalu jalankan ulang."
  exit 1
fi

echo
echo "== Menulis ulang 68 commit =="
# Dibatasi ke --branches: tag cadangan backup/pre-rewrite/* sengaja TIDAK ikut
# ditulis ulang supaya tetap menunjuk ke commit asli sebagai jaring pengaman.
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f \
  --env-filter "
if [ \"\$GIT_AUTHOR_EMAIL\" = \"$EMAIL_LAMA\" ]; then
  export GIT_AUTHOR_NAME=\"$NAMA_BARU\"
  export GIT_AUTHOR_EMAIL=\"$EMAIL_BARU\"
fi
if [ \"\$GIT_COMMITTER_EMAIL\" = \"$EMAIL_LAMA\" ]; then
  export GIT_COMMITTER_NAME=\"$NAMA_BARU\"
  export GIT_COMMITTER_EMAIL=\"$EMAIL_BARU\"
fi
" \
  --msg-filter "bash '$AKAR/scripts/_strip-ai-trailer.sh'" \
  -- --branches

echo
echo "== Sesudah =="
printf 'sisa commit ber-author placeholder (harus 0) : %s\n' "$(git rev-list --branches --author="$EMAIL_LAMA" --count)"
printf 'sisa trailer AI (harus 0)                    : %s\n' "$(git log --branches --format='%b' | grep -ci 'co-authored-by:.*anthropic' || true)"

echo
echo "sebaran author sekarang:"
git rev-list --branches --no-commit-header --format='%ae' | sort | uniq -c

echo
printf 'hari aktif yang akan muncul di heatmap : %s\n' "$(git log alpha-dev --format='%ad' --date=short | sort -u | wc -l)"

echo
echo "SELESAI. Belum ada apa pun yang dikirim ke GitHub."
echo "Periksa hasil di atas, lalu jalankan: bash scripts/push-authorship-fix.sh"
