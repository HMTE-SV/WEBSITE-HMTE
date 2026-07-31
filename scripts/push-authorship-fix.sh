#!/usr/bin/env bash
#
# Mengirim hasil scripts/fix-git-authorship.sh ke GitHub.
#
# Dua hal yang dikerjakan:
#
# 1. main dimajukan ke alpha-dev. GitHub hanya menghitung commit di default
#    branch untuk contribution graph, jadi 50 commit yang terdampar di
#    alpha-dev tidak akan muncul di heatmap sampai langkah ini dilakukan.
#
# 2. Branch yang memang sudah ada di origin di-force-push. Isi berkasnya
#    tidak berubah sedikit pun (tree-nya identik), yang berubah hanya
#    metadata author dan pesan commit.
#
# Branch lokal yang belum pernah ada di origin sengaja TIDAK didorong,
# supaya tidak muncul branch baru yang tidak diminta di repo organisasi.
# Tag cadangan backup/pre-rewrite/* juga tidak didorong: itu jaring pengaman
# lokal, bukan sesuatu yang perlu dilihat orang lain.

set -euo pipefail

EMAIL_LAMA="codex@example.local"
EMAIL_BARU="hexdev.aizen@gmail.com"
BRANCH_ORIGIN="alpha-dev beta-dev main production stable-dev"

cd "$(dirname "$0")/.."

echo "== Pemeriksaan sebelum kirim =="

sisa="$(git rev-list --branches --author="$EMAIL_LAMA" --count)"
if [ "$sisa" != "0" ]; then
  echo "BATAL: masih ada $sisa commit ber-author placeholder."
  echo "Jalankan dulu: bash scripts/fix-git-authorship.sh"
  exit 1
fi
echo "  author placeholder tersisa : 0"

if ! git diff-index --quiet HEAD --; then
  echo "BATAL: ada perubahan belum ter-commit pada berkas ter-track."
  exit 1
fi
echo "  working tree               : bersih"

echo
echo "== Memajukan main ke alpha-dev =="
if git merge-base --is-ancestor main alpha-dev; then
  git branch -f main alpha-dev
  echo "  main dimajukan fast-forward (tanpa merge commit, tanpa konflik)"
else
  echo "BATAL: main bukan leluhur alpha-dev, fast-forward tidak aman."
  echo "Periksa manual sebelum lanjut."
  exit 1
fi

echo
echo "== Mengirim ke origin =="
# --force-with-lease, bukan --force: kalau ternyata ada yang mendorong sesuatu
# ke origin sejak terakhir kali kita fetch, push dibatalkan alih-alih menimpa
# pekerjaan orang.
for b in $BRANCH_ORIGIN; do
  if git show-ref --verify --quiet "refs/heads/$b"; then
    printf '  %-14s ... ' "$b"
    git push --force-with-lease origin "$b:$b" >/dev/null 2>&1 && echo "terkirim" || echo "GAGAL (cek manual)"
  fi
done

echo
echo "== Verifikasi di GitHub =="
sha="$(git rev-parse main)"
echo "  commit teratas main: ${sha:0:8}"
sleep 3
curl -s "https://api.github.com/repos/HMTE-SV/WEBSITE-HMTE/commits/$sha" | python -c "
import json,sys
try:
    d = json.load(sys.stdin)
except Exception:
    print('  (tidak bisa membaca balasan API, cek manual di GitHub)'); sys.exit()
c = d.get('commit', {}).get('author', {})
akun = (d.get('author') or {}).get('login')
print('  email author di commit :', c.get('email'))
print('  dipetakan ke akun      :', akun or 'TIDAK TERPETAKAN')
print()
if akun:
    print('  BERES. Email sudah terhubung ke akun. Heatmap terisi dalam beberapa menit.')
else:
    print('  Commit terkirim, tapi email BELUM terhubung ke akun GitHub mana pun.')
    print('  Buka GitHub > Settings > Emails, tambahkan $EMAIL_BARU,')
    print('  lalu verifikasi lewat email konfirmasi. Heatmap terisi mundur otomatis')
    print('  begitu email terverifikasi, tanpa perlu push ulang.')
"

echo
echo "Cadangan masih utuh kalau perlu dibatalkan:"
echo "  git tag -l 'backup/pre-rewrite/*'"
