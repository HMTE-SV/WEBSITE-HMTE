export function MemberDetailModal() {
  return (
    <div className="os-modal-backdrop" id="memberDetailModal" role="dialog" aria-modal="true" aria-labelledby="modalName">
        <div className="os-modal-window">
          <div className="os-modal-header">
            <div className="window-controls">
              <span className="ctrl-dot red" id="btnModalClose"></span>
              <span className="ctrl-dot yellow"></span>
              <span className="ctrl-dot green"></span>
            </div>
            <div className="os-modal-title">Info Pengurus</div>
            <button className="os-modal-close-btn" aria-label="Tutup dialog" id="btnModalCloseX">&times;</button>
          </div>
          <div className="os-modal-body">
            <div className="member-detail-layout">
              <div className="detail-left">
                <div className="detail-avatar" id="modalAvatar"></div>
                <span className="detail-badge" id="modalBadge">Ketua Himpunan</span>
              </div>
              <div className="detail-right">
                <h3 className="detail-name" id="modalName">Muhammad Reyhan</h3>
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Angkatan</span>
                    <span className="meta-val" id="modalBatch">Teknologi Rekayasa Elektro 2024</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Asal Daerah</span>
                    <span className="meta-val" id="modalOrigin">Sleman, Yogyakarta</span>
                  </div>
                </div>
                <div className="detail-bio">
                  <h4>Bio Organisasi</h4>
                  <p id="modalBio">Berkomitmen memajukan tata kelola internal himpunan untuk mewujudkan sinergi maksimal.</p>
                </div>
                <div className="detail-socials">
                  <h4>Hubungi Pengurus</h4>
                  <div className="social-links">
                    <a href="#" id="modalInsta" target="_blank" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
                    <a href="#" id="modalLinkedin" target="_blank" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
                    <a href="#" id="modalEmail" aria-label="Email"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
