# Advertising Feature Plan

## Overview

Dokumen ini adalah rencana implementasi fitur advertising untuk project `ncmaz-faust`. Fitur yang ditargetkan adalah **Responsive Ad Spaces**: pembuatan ad zone tanpa batas dengan konfigurasi terpisah untuk desktop dan mobile, kompatibel dengan Google AdSense dan custom banner.

Pendekatan implementasi menggunakan Agile Scrum agar fitur bisa dikembangkan bertahap, mudah diuji, dan aman untuk website berita berbasis WordPress headless + Next.js + Faust.

## Goals

- Menyediakan sistem ad space yang reusable untuk berbagai area website.
- Mendukung konfigurasi desktop dan mobile secara terpisah.
- Mendukung Google AdSense script/unit dan custom banner image/link/html.
- Memungkinkan ad zone dibuat tanpa batas dari WordPress.
- Memastikan iklan tidak merusak layout desktop dan mobile.
- Memastikan fallback aman jika konfigurasi iklan kosong atau CMS error.

## Ad Spaces

Ad space awal yang harus didukung:

- Header
- Index top
- Index bottom
- Sidebar 1
- Sidebar 2
- Post detail top
- Post detail bottom
- In-Article

## Recommended Architecture

### WordPress Data Model

Gunakan Custom Post Type `ad_space` atau ACF Options Page. Rekomendasi utama adalah **ACF Options Page** untuk konfigurasi global yang lebih mudah dikelola oleh admin non-teknis.

Konten banner harus bisa diinput dari backend WordPress. Ada tiga pendekatan yang bisa dipakai, dan dapat dikombinasikan sesuai kebutuhan admin:

- **ACF Options Page / CPT fields**: admin mengisi image, link, AdSense slot, atau custom HTML dari form WordPress. Ini direkomendasikan untuk slot global seperti Header, Sidebar, Index top, dan Index bottom.
- **Gutenberg Ad Block**: admin menambahkan block khusus `Ad Space` langsung di editor artikel/halaman. Ini direkomendasikan untuk kebutuhan manual placement, terutama In-Article atau campaign khusus di artikel tertentu.
- **Reusable Block / Pattern**: admin membuat reusable banner/pattern dari WordPress dan frontend membaca/render block tersebut melalui Gutenberg blocks. Ini cocok jika tim editorial ingin mengatur tampilan banner seperti elemen konten biasa.

Rekomendasi implementasi awal adalah menggunakan ACF Options Page untuk semua zone global, lalu menambahkan Gutenberg Ad Block pada sprint berikutnya untuk kebutuhan manual placement dari editor WordPress.

Struktur field yang direkomendasikan:

- `ad_spaces`: repeater group
- `key`: select/string, contoh `header`, `index_top`, `index_bottom`, `sidebar_1`, `sidebar_2`, `post_detail_top`, `post_detail_bottom`, `in_article`
- `label`: nama human readable
- `enabled`: boolean
- `priority`: number untuk urutan jika satu slot punya beberapa iklan
- `provider`: select, nilai `adsense`, `custom_banner`, `custom_html`
- `desktop_enabled`: boolean
- `desktop_adsense_client`: text
- `desktop_adsense_slot`: text
- `desktop_width`: number/string
- `desktop_height`: number/string
- `desktop_image`: image
- `desktop_link_url`: url
- `desktop_custom_html`: textarea
- `mobile_enabled`: boolean
- `mobile_adsense_client`: text
- `mobile_adsense_slot`: text
- `mobile_width`: number/string
- `mobile_height`: number/string
- `mobile_image`: image
- `mobile_link_url`: url
- `mobile_custom_html`: textarea
- `open_in_new_tab`: boolean
- `nofollow_sponsored`: boolean
- `start_date`: date/time optional
- `end_date`: date/time optional

### GraphQL Layer

Expose konfigurasi iklan melalui WPGraphQL.

Jika menggunakan ACF Options Page, pastikan field group diatur agar muncul di schema GraphQL.

Query frontend yang direkomendasikan:

```graphql
query GetAdSpaces {
  ncmazAdSettings {
    adSpaces {
      key
      label
      enabled
      priority
      provider
      desktopEnabled
      desktopAdsenseClient
      desktopAdsenseSlot
      desktopWidth
      desktopHeight
      desktopImage {
        node {
          sourceUrl
          altText
        }
      }
      desktopLinkUrl
      desktopCustomHtml
      mobileEnabled
      mobileAdsenseClient
      mobileAdsenseSlot
      mobileWidth
      mobileHeight
      mobileImage {
        node {
          sourceUrl
          altText
        }
      }
      mobileLinkUrl
      mobileCustomHtml
      openInNewTab
      nofollowSponsored
      startDate
      endDate
    }
  }
}
```

Nama query dan field final perlu disesuaikan dengan hasil schema WordPress aktual.

### Frontend Components

Komponen utama yang direkomendasikan:

- `src/components/AdSpace/AdSpace.tsx`
- `src/components/AdSpace/AdRenderer.tsx`
- `src/components/AdSpace/AdSenseUnit.tsx`
- `src/components/AdSpace/CustomBannerAd.tsx`
- `src/components/AdSpace/CustomHtmlAd.tsx`
- `src/hooks/useAdSpaces.ts`
- `src/fragments/advertising.ts`

Kontrak komponen:

```tsx
<AdSpace zone="header" />
<AdSpace zone="index_top" />
<AdSpace zone="sidebar_1" />
<AdSpace zone="in_article" index={2} />
```

### Rendering Rules

- Jika `enabled = false`, jangan render apapun.
- Jika desktop dan mobile sama-sama kosong, jangan render apapun.
- Desktop ad hanya tampil pada breakpoint desktop.
- Mobile ad hanya tampil pada breakpoint mobile.
- Google AdSense hanya diload satu kali secara global.
- Custom HTML harus dibatasi untuk admin trusted karena memakai `dangerouslySetInnerHTML`.
- Link banner harus memakai `rel="sponsored nofollow noopener"` jika `nofollow_sponsored = true`.
- Banner yang dibuat dari Gutenberg block atau reusable block harus tetap melewati allowlist block/type agar frontend tidak merender markup berbahaya.

### WordPress Admin Input Options

Fitur advertising harus mendukung pengisian konten banner dari admin WordPress, bukan hardcoded di frontend.

#### Option A: ACF Options Page

Use case:

- Slot global dan terstruktur.
- Header, Index top, Index bottom, Sidebar 1, Sidebar 2, Post detail top, Post detail bottom.
- Admin hanya perlu mengisi form tanpa masuk ke editor artikel.

Kelebihan:

- Struktur data rapi.
- Mudah divalidasi.
- Cocok untuk desktop/mobile config terpisah.
- Lebih aman untuk AdSense dan banner sponsor.

Kekurangan:

- Tidak sefleksibel Gutenberg untuk desain custom.
- Butuh field group yang cukup detail.

#### Option B: Custom Gutenberg Ad Block

Use case:

- Admin/editor ingin memasukkan ad secara manual di dalam artikel atau halaman.
- In-Article ad yang posisinya ditentukan langsung dari editor WordPress.
- Campaign khusus yang hanya muncul pada artikel tertentu.

Block attributes yang direkomendasikan:

- `zoneKey`
- `provider`
- `desktopEnabled`
- `desktopImageUrl`
- `desktopLinkUrl`
- `desktopAdsenseClient`
- `desktopAdsenseSlot`
- `desktopCustomHtml`
- `mobileEnabled`
- `mobileImageUrl`
- `mobileLinkUrl`
- `mobileAdsenseClient`
- `mobileAdsenseSlot`
- `mobileCustomHtml`
- `openInNewTab`
- `nofollowSponsored`

Kelebihan:

- Fleksibel untuk editorial.
- Posisi iklan bisa ditentukan langsung di konten.
- Cocok untuk In-Article manual.

Kekurangan:

- Perlu block registration di WordPress.
- Perlu renderer frontend khusus di `MyWordPressBlockViewer` atau mapping block Faust.
- Validasi keamanan harus lebih ketat jika mendukung custom HTML.

#### Option C: Reusable Block Or Pattern

Use case:

- Admin ingin membuat banner sebagai elemen konten visual.
- Banner bisa dipakai ulang di beberapa halaman/post.
- Tim editorial sudah terbiasa memakai Gutenberg pattern/block.

Kelebihan:

- Lebih natural untuk editor WordPress.
- Bisa memanfaatkan UI Gutenberg bawaan.
- Cocok untuk banner editorial/sponsor yang tampil seperti section konten.

Kekurangan:

- Konfigurasi responsive desktop/mobile bisa lebih sulit jika hanya memakai block bawaan.
- Perlu aturan rendering supaya tampilan konsisten di frontend Next.js.

#### Recommended Hybrid Approach

Gunakan pendekatan hybrid:

- ACF Options Page sebagai sumber utama ad zone global.
- Custom Gutenberg Ad Block untuk In-Article manual dan campaign artikel tertentu.
- Reusable Block/Pattern sebagai opsi editorial banner sederhana.

Urutan implementasi:

1. Implementasi ACF Options Page untuk semua ad zones global.
2. Tambahkan `AdSpace` frontend yang membaca config global.
3. Tambahkan custom Gutenberg block `Ad Space` di WordPress.
4. Tambahkan renderer frontend untuk block tersebut.
5. Tambahkan support reusable block/pattern jika dibutuhkan editorial.

## Integration Points

### Header

Lokasi awal:

- `src/container/SiteHeader.tsx`

Rencana:

- Tambahkan `<AdSpace zone="header" />` setelah `Banner` atau sebelum sticky navigation sesuai kebutuhan desain.
- Pastikan tidak mengganggu sticky header.

### Index Top And Bottom

Lokasi potensial:

- `src/wp-templates/page.tsx` untuk homepage Gutenberg/front-page.
- Jika homepage memakai block WordPress, integrasi bisa dilakukan di `PageLayout` dengan deteksi front page atau di template `page.tsx`.

Rencana:

- Tambahkan `index_top` sebelum konten homepage.
- Tambahkan `index_bottom` setelah konten homepage.
- Untuk page biasa, jangan tampilkan kecuali halaman tersebut adalah front page.

### Sidebar 1 And Sidebar 2

Lokasi awal:

- `src/container/singles/Sidebar.tsx`

Rencana:

- Tambahkan `<AdSpace zone="sidebar_1" />` setelah subscriber/social widget.
- Tambahkan `<AdSpace zone="sidebar_2" />` setelah category widget.
- Pastikan sticky sidebar tetap stabil.

### Post Detail Top And Bottom

Lokasi awal:

- `src/wp-templates/single.tsx`
- `src/container/singles/SingleContent.tsx`

Rencana:

- `post_detail_top` ditempatkan setelah post header dan sebelum `SingleContent`.
- `post_detail_bottom` ditempatkan setelah `SingleContent` dan sebelum related posts.

### In-Article

Lokasi awal:

- `src/container/singles/SingleContent.tsx`
- `src/components/MyWordPressBlockViewer.tsx`

Rencana:

- Sisipkan ad setelah block/paragraf tertentu, misalnya setelah block ke-3 atau setiap N block.
- Buat logic yang tidak menyisipkan iklan di awal artikel, heading pertama, gallery, video embed, atau block kosong.
- Gunakan `zone="in_article"` dan optional `index` untuk memilih ad config berbeda bila tersedia.

## Agile Scrum Plan

## Product Vision

Sebagai admin media online, saya ingin mengelola banyak slot iklan responsif dari WordPress agar website dapat menampilkan AdSense atau banner sponsor di area strategis tanpa perlu deploy ulang frontend.

## Stakeholders

- Product Owner: pemilik website / tim bisnis iklan
- Scrum Master: project lead
- Frontend Developer: Next.js/Faust implementation
- WordPress Developer: ACF/WPGraphQL/CMS implementation
- QA: pengujian visual, responsive, dan regression
- Content/Admin User: pengelola slot iklan

## Definition Of Ready

- Ad zones final sudah disetujui.
- Format iklan yang didukung sudah disepakati.
- ACF/WPGraphQL tersedia di CMS staging.
- Akun Google AdSense dan contoh slot ID tersedia.
- Desain minimal untuk desktop/mobile tersedia.

## Definition Of Done

- Admin bisa mengaktifkan/nonaktifkan setiap ad zone.
- Desktop dan mobile config bisa berbeda.
- Google AdSense dan custom banner berhasil tampil.
- Empty state tidak merusak layout.
- Build Next.js berhasil.
- Tampilan sudah diuji desktop dan mobile.
- Tidak ada console error kritikal terkait ad rendering.
- Dokumentasi konfigurasi admin tersedia.

## Epic 1: WordPress Advertising Data Model

User story:

Sebagai admin, saya ingin mengelola ad spaces dari WordPress agar konfigurasi iklan dapat diubah tanpa deploy frontend.

Acceptance criteria:

- ACF Options Page atau CPT tersedia untuk mengelola ad spaces.
- Admin dapat menambahkan ad zone tidak terbatas.
- Setiap ad zone punya konfigurasi desktop dan mobile.
- Field iklan muncul di WPGraphQL.
- Field inactive/expired tidak dikonsumsi frontend.

Tasks:

- Buat field group advertising di WordPress.
- Tambahkan select option untuk ad zone standar.
- Tambahkan dukungan custom key untuk ad zone tambahan.
- Expose field via WPGraphQL.
- Dokumentasikan cara admin mengisi field.

## Epic 2: Frontend Ad Rendering System

User story:

Sebagai visitor, saya ingin melihat iklan yang sesuai perangkat agar pengalaman membaca tetap nyaman dan monetisasi berjalan.

Acceptance criteria:

- Komponen `AdSpace` dapat menerima prop `zone`.
- Komponen memilih config berdasarkan zone dan breakpoint.
- Komponen mendukung AdSense, custom banner, dan custom HTML.
- Komponen tidak render saat config kosong atau disabled.
- Script AdSense tidak diinject berkali-kali.

Tasks:

- Buat types `AdSpaceZone`, `AdProvider`, dan `AdConfig`.
- Buat query/fragment advertising.
- Buat hook `useAdSpaces` atau context provider.
- Buat `AdSpace` wrapper.
- Buat renderer untuk AdSense, banner, dan HTML.
- Tambahkan skeleton/placeholder opsional untuk development.

## Epic 3: Layout Integration

User story:

Sebagai admin, saya ingin slot iklan muncul di area strategis agar inventory iklan website lengkap.

Acceptance criteria:

- Header ad tampil pada area header.
- Index top dan bottom tampil hanya pada homepage/index.
- Sidebar 1 dan sidebar 2 tampil di sidebar artikel.
- Post detail top dan bottom tampil di halaman detail artikel.
- In-Article tampil di dalam konten artikel tanpa merusak block WordPress.

Tasks:

- Integrasikan `header` di `SiteHeader`.
- Integrasikan `index_top` dan `index_bottom` di homepage template.
- Integrasikan `sidebar_1` dan `sidebar_2` di `Sidebar`.
- Integrasikan `post_detail_top` dan `post_detail_bottom` di `single.tsx` atau `SingleContent`.
- Sisipkan `in_article` melalui wrapper block renderer.
- Uji sticky header/sidebar dan spacing.

## Epic 4: AdSense Compatibility And Performance

User story:

Sebagai pemilik website, saya ingin AdSense berjalan sesuai best practice agar pendapatan iklan stabil dan tidak mengganggu performa.

Acceptance criteria:

- Script AdSense diload via `next/script`.
- Setiap unit punya `data-ad-client` dan `data-ad-slot`.
- Tidak ada duplicate script injection.
- Layout shift dikurangi dengan reserved size/min-height.
- Mobile ad tidak menyebabkan horizontal scroll.

Tasks:

- Tambahkan global AdSense script loader.
- Buat komponen `AdSenseUnit` dengan defensive rendering.
- Tambahkan min-height per breakpoint.
- Tambahkan handling `adsbygoogle.push({})` setelah mount.
- Validasi di browser console.

## Epic 5: QA, Admin Guide, And Release

User story:

Sebagai tim operasional, saya ingin fitur iklan terdokumentasi dan aman dirilis agar bisa dipakai tanpa bantuan developer setiap waktu.

Acceptance criteria:

- Ada checklist QA responsive.
- Ada panduan setup AdSense dan custom banner.
- Ada release notes.
- Ada rollback plan.

Tasks:

- Buat test matrix desktop/mobile.
- Uji semua zone dengan data aktif/nonaktif.
- Uji kondisi CMS field kosong.
- Uji build production.
- Buat admin guide singkat.

## Sprint Plan

### Sprint 0: Discovery And Setup

Duration: 2 sampai 3 hari.

Goal:

Memastikan data model, schema GraphQL, dan area layout final.

Deliverables:

- Final ad zone keys.
- Final field structure.
- ACF/WPGraphQL proof of concept.
- Technical design approved.

### Sprint 1: WordPress Schema And Basic Frontend Renderer

Duration: 1 minggu.

Goal:

Admin bisa membuat ad config dan frontend bisa render satu slot dasar.

Deliverables:

- ACF Options Page/CPT advertising.
- GraphQL query advertising.
- `AdSpace` basic component.
- Support custom banner desktop/mobile.

### Sprint 2: Full Zone Integration

Duration: 1 minggu.

Goal:

Semua ad spaces awal sudah terpasang di layout website.

Deliverables:

- Header ad.
- Index top and bottom ads.
- Sidebar 1 and sidebar 2 ads.
- Post detail top and bottom ads.
- In-Article ad insertion.

### Sprint 3: AdSense, Performance, And QA

Duration: 1 minggu.

Goal:

AdSense kompatibel, layout stabil, dan fitur siap release.

Deliverables:

- AdSense component.
- Script loading strategy.
- Responsive QA pass.
- Build production pass.
- Admin documentation.

## Prioritized Product Backlog

| Priority | Item | Description |
| --- | --- | --- |
| P0 | WordPress ad config | Admin dapat mengelola ad spaces dari CMS |
| P0 | GraphQL exposure | Frontend bisa mengambil config ads |
| P0 | AdSpace component | Komponen reusable berdasarkan zone |
| P0 | Custom banner support | Render image/link desktop dan mobile |
| P0 | Layout integration | Pasang semua zone utama |
| P1 | Google AdSense support | Render AdSense unit dengan script loader |
| P1 | In-Article insertion | Sisipkan iklan dalam konten artikel |
| P1 | Date scheduling | Aktif/nonaktif berdasarkan tanggal |
| P2 | Multiple ads per zone rotation | Rotasi iklan berdasarkan priority/random |
| P2 | Impression/click tracking | Tracking internal sederhana atau analytics event |
| P2 | Role-based admin guide | Dokumentasi operasional untuk admin |

## Technical Risks

- WPGraphQL schema dapat berbeda antara local, staging, dan production.
- Custom HTML dapat menjadi risiko keamanan jika diberikan ke user non-admin.
- AdSense bisa tidak tampil saat development karena policy/domain approval.
- In-Article insertion bisa merusak flow konten jika tidak hati-hati terhadap block Gutenberg.
- Build bisa gagal bila query advertising tidak dibuat defensif terhadap CMS error.

## Mitigation

- Gunakan optional chaining dan empty fallback pada semua ad config.
- Jangan jadikan iklan dependency wajib untuk render page.
- Query ad config dibuat global dan toleran terhadap `null`.
- Batasi custom HTML hanya untuk administrator.
- Siapkan feature flag `NEXT_PUBLIC_ENABLE_ADS`.
- Siapkan placeholder development yang tidak aktif di production.

## Suggested Frontend Types

```ts
export type AdSpaceZone =
	| 'header'
	| 'index_top'
	| 'index_bottom'
	| 'sidebar_1'
	| 'sidebar_2'
	| 'post_detail_top'
	| 'post_detail_bottom'
	| 'in_article'
	| string

export type AdProvider = 'adsense' | 'custom_banner' | 'custom_html'

export type ResponsiveAdConfig = {
	enabled?: boolean
	adsenseClient?: string | null
	adsenseSlot?: string | null
	width?: string | number | null
	height?: string | number | null
	imageUrl?: string | null
	imageAlt?: string | null
	linkUrl?: string | null
	customHtml?: string | null
}

export type AdConfig = {
	key: AdSpaceZone
	label?: string | null
	enabled?: boolean
	provider: AdProvider
	priority?: number | null
	desktop?: ResponsiveAdConfig
	mobile?: ResponsiveAdConfig
	openInNewTab?: boolean
	nofollowSponsored?: boolean
	startDate?: string | null
	endDate?: string | null
}
```

## QA Checklist

- Header ad desktop tampil dan tidak menutup navigation.
- Header ad mobile tampil proporsional dan tidak menyebabkan horizontal scroll.
- Index top tampil sebelum konten utama homepage.
- Index bottom tampil setelah konten utama homepage.
- Sidebar ads tampil di desktop sidebar.
- Sidebar ads tampil aman di mobile ketika sidebar turun ke bawah.
- Post detail top tampil setelah header artikel.
- Post detail bottom tampil sebelum related posts.
- In-Article ad tampil di tengah artikel dan tidak masuk ke block kosong.
- Semua slot tidak render saat disabled.
- Build production berhasil saat semua ads disabled.
- Build production berhasil saat CMS ad config kosong.
- AdSense script hanya muncul satu kali.
- Banner link memakai `rel="sponsored nofollow noopener"` bila dikonfigurasi.

## Release Strategy

- Release ke staging dengan semua ads disabled.
- Aktifkan custom banner untuk satu zone terlebih dahulu.
- Validasi layout desktop dan mobile.
- Aktifkan AdSense untuk satu zone.
- Monitor browser console dan Core Web Vitals.
- Aktifkan semua zone bertahap.

## Rollback Plan

- Set `NEXT_PUBLIC_ENABLE_ADS=false` jika menggunakan feature flag.
- Nonaktifkan semua ad spaces dari WordPress.
- Revert commit frontend jika terjadi layout regression besar.

## Initial Implementation Order

1. Buat data model WordPress dan expose GraphQL.
2. Tambahkan frontend types dan query fragment advertising.
3. Buat `AdSpace` dan custom banner renderer.
4. Integrasikan Header, Index top, Index bottom, Sidebar 1, Sidebar 2.
5. Integrasikan Post detail top, Post detail bottom, dan In-Article.
6. Tambahkan Google AdSense support.
7. Tambahkan QA dan admin documentation.
