/*
 * Kapan beranda dibuka oleh cerita scroll (Hero.tsx): layar lebar di browser
 * biasa. Selain itu — HP, atau situs yang dibuka sebagai aplikasi — yang
 * tampil HeroOpener.tsx. Harus sama persis dengan gerbang di
 * css/hero-opener.css; satu kueri tunggal (tanpa koma) karena
 * MediaGatedImage membaliknya dengan `not all and …`.
 */
export const STORY_MEDIA_QUERY = '(min-width: 769px) and (display-mode: browser)'
