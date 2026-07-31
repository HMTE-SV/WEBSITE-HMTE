#!/usr/bin/env bash
#
# Membuang trailer Co-Authored-By milik asisten AI dari pesan commit.
# Dipakai sebagai --msg-filter oleh scripts/fix-git-authorship.sh.
#
# Arahan, keputusan, dan review datang dari pemilik repo. Trailer co-author
# membuat GitHub menampilkan entri kontributor tambahan yang tidak mewakili
# siapa pun, persis masalah yang sedang diperbaiki di sisi author.

msg="$(cat)"

# Baris trailer dibuang, lalu baris kosong yang menggantung di akhir ikut
# dirapikan supaya pesan tidak berakhir dengan paragraf kosong.
printf '%s\n' "$msg" \
  | sed -E '/^[[:space:]]*[Cc]o-[Aa]uthored-[Bb]y:.*([Cc]laude|anthropic\.com)/d' \
  | sed -e :a -e '/^$/{$d;N;ba' -e '}'
