# WordPress Plugin Advertising Upgrade Plan

## Purpose

Rencana ini menjabarkan upgrade backend plugin `wp-plugin/ncmaz-faust-core` agar mendukung Responsive Ad Spaces pada frontend `ncmaz-faust`.

Targetnya adalah admin WordPress dapat mengelola iklan global dari wp-admin, memasukkan Ad Space secara manual dari Gutenberg, dan frontend headless memperoleh konfigurasi render melalui WPGraphQL.

## Audit Summary

### Existing Plugin Architecture

- Bootstrap plugin: `wp-plugin/ncmaz-faust-core/ncmaz-faust-core.php`
- ACF fields programmatic: `includes/ncmazfc-AFC-fields.php`
- WPGraphQL custom schema: `includes/ncmazfc-wpgraphql-custom-where.php`
- Gutenberg registration: `includes/gutenberg/ncmazfc-register-blocks.php`
- Gutenberg source: `src/block-*`
- Gutenberg compiled output: `build/block-*`
- Build command: `npm run build` via `@wordpress/scripts`

### Important Constraints

- Plugin mewajibkan ACF, WPGraphQL, WPGraphQL for ACF, WPGraphQL Content Blocks, FaustWP, Smart Cache, dan MailPoet.
- Dependency ACF yang terdaftar adalah `advanced-custom-fields` versi gratis.
- `acf_add_options_page()` umumnya hanya tersedia pada ACF Pro, sehingga **jangan gunakan ACF Options Page sebagai fondasi fitur iklan**.
- Plugin belum memiliki settings page, CPT advertising, ad-specific GraphQL type, atau Gutenberg Ad Space block.
- Frontend saat ini membaca `NC_SITE_SETTINGS.advertising`; ia belum mengambil data advertising dari GraphQL. Backend dan frontend perlu disambungkan melalui kontrak GraphQL pada sprint integrasi.

## Architecture Decision

Gunakan pendekatan hybrid berikut:

- **Global slots**: WordPress Settings API dengan option `ncmazfc_advertising_settings`.
- **Data API**: field read-only `ncmazFaustAdvertising` pada `RootQuery` WPGraphQL.
- **Manual editorial placement**: block `ncmaz-faust/ad-space` untuk Gutenberg dan reusable blocks/patterns.
- **Provider script rendering**: tetap dilakukan di frontend Next.js. Plugin hanya menyimpan dan mengekspos konfigurasi render, bukan menjalankan script AdSense pada server WordPress.

Alasan:

- Tidak menambah ketergantungan ACF Pro.
- Konfigurasi global tersimpan dan dikelola dari wp-admin.
- GraphQL payload dapat dibuat typed, sempit, dan aman untuk konsumsi public.
- Editor dapat menempatkan ad slot khusus langsung di artikel tanpa memberi akses ke script pihak ketiga.

## Ad Zones

Initial zone keys:

- `header`
- `index_top`
- `index_bottom`
- `sidebar_1`
- `sidebar_2`
- `post_detail_top`
- `post_detail_bottom`
- `in_article`

Admin dapat membuat custom zone key tambahan. Key wajib menggunakan lowercase, angka, underscore, atau dash: `^[a-z0-9_-]+$`.

## Target Data Contract

### Stored WordPress Option

Option name: `ncmazfc_advertising_settings`

```php
[
  'enabled' => true,
  'slots' => [
    'header' => [
      [
        'key' => 'header',
        'label' => 'Header Leaderboard',
        'enabled' => true,
        'priority' => 10,
        'provider' => 'custom_banner',
        'desktop' => [
          'enabled' => true,
          'image_id' => 123,
          'link_url' => 'https://advertiser.example/',
          'width' => '970',
          'height' => '250',
        ],
        'mobile' => [
          'enabled' => true,
          'image_id' => 124,
          'link_url' => 'https://advertiser.example/',
          'width' => '320',
          'height' => '100',
        ],
        'open_in_new_tab' => true,
        'nofollow_sponsored' => true,
        'start_date' => null,
        'end_date' => null,
      ],
    ],
  ],
]
```

### Providers

- `custom_banner`: image attachment ID + destination URL.
- `adsense`: public client ID + slot ID only.
- `custom_html`: HTML embed for trusted administrators only.

Tidak boleh menyimpan provider API secret, private token, atau credential di konfigurasi yang diekspos GraphQL.

### Target WPGraphQL Query

```graphql
query GetAdvertisingSettings {
  ncmazFaustAdvertising {
    enabled
    slots {
      key
      label
      enabled
      priority
      provider
      openInNewTab
      nofollowSponsored
      startDate
      endDate
      desktop {
        enabled
        provider
        adsenseClient
        adsenseSlot
        image {
          sourceUrl
          altText
        }
        linkUrl
        customHtml
        width
        height
      }
      mobile {
        enabled
        provider
        adsenseClient
        adsenseSlot
        image {
          sourceUrl
          altText
        }
        linkUrl
        customHtml
        width
        height
      }
    }
  }
}
```

GraphQL resolver harus mengembalikan hanya slot aktif dalam rentang tanggal aktif. `customHtml` hanya boleh dikembalikan ke public schema jika setting tersebut disetujui Product Owner dan hanya dapat diedit oleh user dengan capability `unfiltered_html`.

## Admin UX

Tambahkan submenu:

- Parent: `Settings`
- Menu title: `Advertising`
- Capability: `manage_options`
- Page slug: `ncmazfc-advertising`

Halaman admin menyediakan:

- Global enable/disable switch.
- Daftar zone dengan tombol Add slot dan Remove slot.
- Pilihan existing zone atau custom key.
- Pilihan provider.
- Field Desktop dan Mobile terpisah.
- WordPress Media Library selector untuk banner image.
- URL field, ukuran, open in new tab, sponsored/nofollow.
- Jadwal start/end opsional.
- Warning keamanan di field custom HTML.

## Security And Validation

- Semua submit memakai Settings API nonce.
- Akses hanya `manage_options`.
- Zone key disanitasi dengan `sanitize_key`; custom key divalidasi regex.
- URL memakai `esc_url_raw`.
- Width/height dibatasi integer positif atau empty.
- Priority dibatasi integer.
- Date disimpan dalam ISO 8601 UTC.
- Attachment ID divalidasi sebagai attachment image.
- Provider harus salah satu dari `adsense`, `custom_banner`, `custom_html`.
- Custom HTML ditolak untuk user tanpa `unfiltered_html`.
- Gunakan allowlist markup `wp_kses` untuk HTML non-script. Jika provider memang membutuhkan script, simpan hanya untuk administrator, audit source provider, dan jangan izinkan editor/contributor mengubahnya.
- Resolver GraphQL tidak boleh mengirim slot disabled, expired, malformed, atau secret.

## Gutenberg Ad Space Block

### Block Identity

- Name: `ncmaz-faust/ad-space`
- PHP/GraphQL typename target: `NcmazFaustBlockAdSpace`
- Category: existing `ncmazfc-blocks`

### Source Files To Add

- `src/block-ad-space/block.json`
- `src/block-ad-space/index.js`
- `src/block-ad-space/Edit.tsx`
- `src/block-ad-space/Save.tsx`
- `src/block-ad-space/attributes.ts`
- `src/block-ad-space/style.scss`
- `src/block-ad-space/editor.scss`

### Registration Changes

Update `includes/gutenberg/ncmazfc-register-blocks.php`:

```php
register_block_type( NCMAZFC_BUILD_PATH . '/block-ad-space', [] );
```

Build output `build/block-ad-space/` wajib ikut dalam distribusi plugin.

### Block Attributes

- `slot`: zone key selected by editor.
- `label`: label aksesibilitas/editorial.
- `showLabel`: tampilkan label Sponsored/Advertisement bila perlu.
- `desktopEnabled` dan `mobileEnabled`.
- `desktopMinHeight` dan `mobileMinHeight` untuk mengurangi layout shift.
- Standard WordPress support: `align`, `anchor`, `className`, spacing.

Block tidak menyimpan AdSense client ID, HTML embed, atau banner URL sendiri pada tahap awal. Ia hanya mereferensikan slot global. Ini menjaga governance iklan dan mencegah editor menambahkan third-party script.

### Editor Behavior

- Render preview placeholder, bukan iklan live atau script live.
- Inspector memakai SelectControl untuk slot yang tersedia.
- Beri status jika slot belum ada atau disabled.
- Tampilkan desktop/mobile preview label.
- Reusable block dan synced pattern otomatis didukung karena block bersifat static Gutenberg block.

### Frontend Headless Behavior

- WPGraphQL Content Blocks mengekspos `renderedHtml`, attributes, dan typename block.
- Frontend memetakan `NcmazFaustBlockAdSpace` ke renderer `AdSpace`.
- Frontend tidak boleh mengeksekusi arbitrary `<script>` dari `renderedHtml` block.
- Block frontend menggunakan `slot` attribute untuk mengambil config dari `ncmazFaustAdvertising`.

## Agile Delivery Plan

## Epic 1: Foundation And Settings Storage

User story: sebagai administrator, saya dapat mengaktifkan fitur advertising dan menyimpan slot global dari wp-admin.

### Sprint 1: Settings API And Data Model

Duration: 3 sampai 5 hari.

Steps:

1. Tambah `includes/advertising/index.php` dan load dari `ncmaz-faust-core.php`.
2. Tambah `includes/advertising/settings.php` untuk admin menu, `register_setting`, dan render form.
3. Tambah `includes/advertising/sanitizer.php` untuk normalisasi dan validasi option.
4. Definisikan default option yang disabled agar upgrade tidak langsung menampilkan iklan.
5. Implementasikan UI add/remove slot menggunakan JavaScript admin minimal atau row templates PHP.
6. Tambahkan uninstall behavior: pertahankan option secara default; hapus hanya jika admin explicit memilih cleanup.

Acceptance criteria:

- Settings page hanya dapat dibuka administrator.
- Admin dapat membuat satu `custom_banner` slot dengan desktop/mobile banner berbeda.
- Data invalid ditolak atau dibersihkan sebelum disimpan.
- Fitur default disabled setelah install/upgrade.

## Epic 2: Public Read-Only GraphQL API

User story: sebagai frontend headless, saya dapat mengambil konfigurasi iklan aktif dalam format typed GraphQL.

### Sprint 2: Schema And Resolver

Duration: 2 sampai 4 hari.

Steps:

1. Tambah `includes/advertising/graphql.php`.
2. Load module ini setelah WPGraphQL tervalidasi, bersama file di hook `plugins_loaded` pada `ncmaz-faust-core.php`.
3. Register object types:
   - `NcmazFaustAdvertisingSettings`
   - `NcmazFaustAdSlot`
   - `NcmazFaustAdPlacement`
4. Register field `RootQuery.ncmazFaustAdvertising` mengikuti pola `RootQuery.siteLogo` di `includes/ncmazfc-wpgraphql-custom-where.php`.
5. Resolver membaca option, memfilter enabled/expired slot, memetakan attachment ID ke `WPGraphQL\Model\Post`.
6. Tambahkan field cache dependency/tag bila Smart Cache menyediakan API yang kompatibel.
7. Tambahkan test query ke dokumentasi plugin.

Acceptance criteria:

- Query GraphQL dapat mengambil banner desktop/mobile dan metadata slot.
- Slot inactive/expired tidak muncul.
- Image return sebagai `MediaItem`, bukan raw attachment ID.
- Query tidak mengekspos credentials atau data admin-only.

## Epic 3: Gutenberg Ad Space Block

User story: sebagai editor, saya dapat menempatkan slot iklan yang dikelola admin di posisi spesifik dalam post atau page.

### Sprint 3: Block Authoring And Build

Duration: 3 sampai 5 hari.

Steps:

1. Buat source `src/block-ad-space/` menggunakan pola `src/block-cta/`.
2. Tambahkan `slot` select dan responsive placeholder di `Edit.tsx`.
3. Simpan semantic markup dan attributes pada `Save.tsx`; jangan simpan provider script.
4. Register block pada `includes/gutenberg/ncmazfc-register-blocks.php`.
5. Tambahkan block ke allowed children `src/block-group/Edit.tsx` hanya jika product design membutuhkan nesting.
6. Jalankan `npm run build` di plugin agar `build/block-ad-space/` dibuat.
7. Verifikasi block muncul di category `ncmazfc-blocks`, dapat disimpan, dan dapat digunakan sebagai reusable/synced block.

Acceptance criteria:

- Editor bisa menambahkan dan memilih slot.
- Preview tidak memuat script iklan pihak ketiga.
- Post/page dengan block dapat dikonsumsi WPGraphQL Content Blocks.
- Reusable block/pattern menampilkan metadata slot yang sama di frontend headless.

## Epic 4: Frontend Contract Integration

User story: sebagai visitor, saya melihat creative yang sesuai device dan zone melalui frontend headless.

### Sprint 4: Coordinated Frontend Integration

Duration: 3 sampai 5 hari.

Backend steps:

1. Freeze names/type/field GraphQL yang sudah disetujui.
2. Generate dan publish schema staging.
3. Tambahkan sample data satu slot pada staging.
4. Dokumentasikan GraphQL query dan expected response.

Frontend coordination:

1. Tambah fragment/query `ncmazFaustAdvertising` ke template/layout yang perlu ads.
2. Refactor `src/contains/advertising.ts` agar memakai GraphQL payload sebagai source utama, bukan hanya `NC_SITE_SETTINGS.advertising`.
3. Simpan static site settings sebagai fallback development saja.
4. Map `NcmazFaustBlockAdSpace` ke `AdSpace` renderer berdasarkan block attribute `slot`.
5. Pastikan Next.js build tahan terhadap CMS unavailable seperti fallback yang sudah diterapkan.

Acceptance criteria:

- Mengubah banner di WordPress muncul di frontend setelah ISR/cache refresh tanpa deploy frontend.
- Header, index, sidebar, post detail, dan in-article zone dapat dikonfigurasi dari wp-admin.
- Frontend tidak render slot kosong.

## Epic 5: QA, Security Review, And Release

### Sprint 5: Stabilization

Duration: 2 sampai 4 hari.

Steps:

1. Uji custom banner untuk setiap initial zone pada desktop dan mobile.
2. Uji slot disabled, date expired, invalid URL, missing image, dan custom key.
3. Uji AdSense public client/slot rendering di staging domain terotorisasi.
4. Uji Gutenberg block dalam post, reusable block, synced pattern, dan nested group jika diaktifkan.
5. Audit capability dan sanitization custom HTML.
6. Jalankan `npm run lint:js`, `npm run lint:css`, dan `npm run build` pada plugin.
7. Jalankan `npm run build` pada frontend.
8. Buat release notes dan rollback procedure.

Acceptance criteria:

- Tidak ada PHP warning/fatal pada PHP minimum yang didukung.
- Tidak ada GraphQL schema validation error.
- Tidak ada JavaScript error di Gutenberg editor atau Next.js browser console.
- UI aman saat slot/config kosong.

## File-Level Implementation Map

| File | Change |
| --- | --- |
| `ncmaz-faust-core.php` | Load advertising settings module; load GraphQL module setelah dependency validation |
| `includes/advertising/index.php` | New module bootstrap |
| `includes/advertising/settings.php` | Settings API page, option registration, admin render |
| `includes/advertising/sanitizer.php` | Validation and normalization |
| `includes/advertising/graphql.php` | Typed WPGraphQL objects and `RootQuery.ncmazFaustAdvertising` resolver |
| `includes/gutenberg/ncmazfc-register-blocks.php` | Register `block-ad-space` |
| `src/block-ad-space/*` | New Gutenberg block source |
| `build/block-ad-space/*` | Generated build assets, committed for plugin deployment |
| `src/block-group/Edit.tsx` | Optional: allow Ad Space as child block |
| `readme.txt` | Add setup and dependency documentation |
| `package.json` | Align package version with plugin header during release |

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| ACF Options Page unavailable | Use WordPress Settings API, not ACF Pro APIs |
| Arbitrary ad HTML introduces XSS | Restrict to `unfiltered_html`, sanitize, audit provider snippets |
| GraphQL exposes sensitive data | Return only public render data; never API keys/secrets |
| Block source built but output missing | Commit `build/block-ad-space` and validate plugin ZIP contents |
| Schema differs across environments | Run codegen against staging schema before frontend release |
| Stale ads due cache | Use short ISR/revalidation and Smart Cache invalidation if available |
| Provider scripts break Gutenberg | Never execute third-party scripts inside the editor |

## Release Checklist

1. Backup `ncmazfc_advertising_settings` production option.
2. Deploy plugin update with global advertising disabled.
3. Confirm GraphQL schema includes `ncmazFaustAdvertising`.
4. Configure one custom banner in staging.
5. Deploy frontend GraphQL consumer.
6. Validate responsive layout and cache refresh.
7. Enable one zone in production.
8. Monitor PHP logs, GraphQL errors, Core Web Vitals, and ad provider console.
9. Enable remaining zones gradually.

## Rollback

- Disable global advertising from wp-admin.
- Restore backed-up `ncmazfc_advertising_settings` option if configuration is corrupted.
- Deactivate the plugin update or reinstall previous plugin ZIP if schema/block registration causes a regression.
- Set frontend `NEXT_PUBLIC_ENABLE_ADS=false` while backend issue is investigated.
