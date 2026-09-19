(() => {
  'use strict'
  const signs = window.SIGNS
  const app = document.querySelector('#app')
  const header = document.querySelector('#site-header')
  const footer = document.querySelector('#site-footer')
  const STORAGE_KEY = 'michishirube-progress-v1'
  const state = { view: 'home', learnId: signs[0].id, learnQuery: '', learnFilter: 'all', flashcard: false, revealed: false, libraryQuery: '', libraryCategory: 'Tất cả', questions: [], quizIndex: 0, selected: null, answers: [] }
  const emptyStats = () => ({ viewCount: 0, correctCount: 0, wrongCount: 0, lastAnsweredAt: null, status: 'unseen', mastered: false, weak: false })
  const freshProgress = () => ({ signs: Object.fromEntries(signs.map(sign => [sign.id, emptyStats()])), totalAnswered: 0, totalCorrect: 0, wrongIds: [] })
  const loadProgress = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!parsed) return freshProgress()
      const fresh = freshProgress()
      signs.forEach(sign => { fresh.signs[sign.id] = { ...emptyStats(), ...(parsed.signs?.[sign.id] || {}) } })
      fresh.totalAnswered = parsed.totalAnswered || 0
      fresh.totalCorrect = parsed.totalCorrect || 0
      fresh.wrongIds = (parsed.wrongIds || []).filter(id => signs.some(sign => sign.id === id))
      return fresh
    } catch { return freshProgress() }
  }
  let progress = loadProgress()
  const saveProgress = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
  const image = sign => `<img src="${esc(sign.image)}" alt="${esc(sign.vietnameseName)}">`
  const progressBar = (value, max, label = 'Tiến độ') => `<div class="progress-wrap"><div class="progress-label"><span>${esc(label)}</span><strong>${value} / ${max}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${max ? Math.min(100, Math.round(value / max * 100)) : 0}%"></div></div></div>`
  const shuffle = list => { const copy = [...list]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] } return copy }

  function setView(view) {
    state.view = view
    header.hidden = view === 'quiz'
    footer.hidden = view === 'quiz'
    document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view || (view === 'results' && button.dataset.view === 'setup')))
    window.scrollTo(0, 0)
    render()
  }
  function markViewed(id) {
    const current = progress.signs[id] || emptyStats()
    progress.signs[id] = { ...current, viewCount: current.viewCount + 1, status: current.status === 'unseen' ? 'learning' : current.status }
    saveProgress()
  }
  function setStatus(id, status) {
    progress.signs[id] = { ...(progress.signs[id] || emptyStats()), status, mastered: status === 'mastered' }
    saveProgress()
  }
  function recordAnswer(id, correct) {
    const current = progress.signs[id] || emptyStats()
    const correctCount = current.correctCount + (correct ? 1 : 0)
    const wrongCount = current.wrongCount + (correct ? 0 : 1)
    progress.signs[id] = { ...current, viewCount: current.viewCount + 1, correctCount, wrongCount, lastAnsweredAt: new Date().toISOString(), status: current.status === 'unseen' ? 'learning' : current.status, weak: wrongCount > correctCount || wrongCount >= 3 }
    progress.totalAnswered++
    if (correct) progress.totalCorrect++
    if (!correct && !progress.wrongIds.includes(id)) progress.wrongIds.push(id)
    saveProgress()
  }

  function renderHome() {
    const allStats = Object.values(progress.signs)
    const learned = allStats.filter(item => item.status !== 'unseen').length
    const mastered = allStats.filter(item => item.mastered).length
    const weak = allStats.filter(item => item.weak).length
    const accuracy = progress.totalAnswered ? Math.round(progress.totalCorrect / progress.totalAnswered * 100) : 0
    app.innerHTML = `<main class="home-page page-enter"><section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> HỌC NHẸ NHÀNG · NHỚ THẬT LÂU</span><h1>Biển báo Nhật Bản,<br><em>hiểu đúng từng chi tiết.</em></h1><p>Học bằng hình ảnh thật, kiểm tra ngay sau mỗi câu và ôn lại đúng những gì bạn còn yếu.</p><div class="hero-actions"><button class="primary-button" data-action="learn">Bắt đầu học <span>→</span></button><button class="secondary-button" data-view="setup">Làm quiz</button></div><button class="text-link" data-view="library">Hoặc xem toàn bộ thư viện <span>↗</span></button></div><div class="hero-visual" aria-hidden="true"><div class="sun-disc"></div><div class="visual-card back"><img src="./public/signs/33.jpg" alt=""></div><div class="visual-card front"><span>BIỂN #01</span><img src="./public/signs/1.png" alt=""><strong>Cấm quay đầu xe</strong><small>Giao thông Nhật Bản</small></div><div class="float-pill pill-one">✓ Nội dung đã đối chiếu</div><div class="float-pill pill-two">33 biển & tín hiệu</div></div></section>
    <section class="dashboard-section"><div class="section-heading"><div><span class="eyebrow">TIẾN ĐỘ CỦA BẠN</span><h2>Mỗi ngày một chút.</h2></div><span>${learned ? 'Tiếp tục nhé!' : 'Bắt đầu hôm nay'}</span></div><div class="stats-grid"><div class="stat-card featured"><span class="stat-icon">◎</span><div><small>ĐÃ HỌC</small><strong>${learned}<i>/${signs.length}</i></strong></div>${progressBar(learned, signs.length)}</div><div class="stat-card"><span class="stat-icon coral">◇</span><div><small>ĐÃ THUỘC</small><strong>${mastered}</strong><p>biển & tín hiệu</p></div></div><div class="stat-card"><span class="stat-icon amber">!</span><div><small>ĐANG YẾU</small><strong>${weak}</strong><p>cần ôn tập</p></div></div><div class="stat-card"><span class="stat-icon green">↗</span><div><small>ĐỘ CHÍNH XÁC</small><strong>${accuracy}%</strong><p>${progress.totalAnswered} câu đã trả lời</p></div></div></div></section>
    <section class="quick-actions"><button data-action="learn"><span>01</span><div><strong>Học biển báo</strong><small>Xem chi tiết từng biển</small></div><b>→</b></button><button data-view="setup"><span>02</span><div><strong>Làm quiz</strong><small>Nhiều chế độ luyện tập</small></div><b>→</b></button><button data-quiz="wrong" ${progress.wrongIds.length ? '' : 'disabled'}><span>03</span><div><strong>Ôn câu sai</strong><small>${progress.wrongIds.length} biển từng trả lời sai</small></div><b>→</b></button><button data-quiz="weak" ${weak ? '' : 'disabled'}><span>04</span><div><strong>Ôn biển yếu</strong><small>Ưu tiên điểm còn yếu</small></div><b>→</b></button></section></main>`
  }

  function renderLibrary() {
    const categories = ['Tất cả', 'Biển cấm', 'Biển chỉ dẫn', 'Vạch đường', 'Đèn tín hiệu', 'Tín hiệu cảnh sát', 'Biển phụ', 'Khác']
    const query = state.libraryQuery.trim().toLocaleLowerCase('vi')
    const filtered = signs.filter(sign => (state.libraryCategory === 'Tất cả' || sign.category === state.libraryCategory) && (!query || [sign.vietnameseName, sign.japaneseName || '', sign.explanation].join(' ').toLocaleLowerCase('vi').includes(query)))
    app.innerHTML = `<main class="library-page page-enter"><header class="page-title"><span class="eyebrow">THƯ VIỆN</span><h1>Tất cả biển & tín hiệu</h1><p>Tìm theo tên, con số hoặc nội dung giải thích.</p></header><div class="library-toolbar"><label class="search-box"><span>⌕</span><input id="library-search" value="${esc(state.libraryQuery)}" placeholder="Tìm ‘quay đầu’, ‘50’, ‘người đi bộ’..."></label><span>${filtered.length} kết quả</span></div><div class="filter-row">${categories.map(category => `<button data-category="${esc(category)}" class="${state.libraryCategory === category ? 'active' : ''}">${esc(category)}</button>`).join('')}</div>${filtered.length ? `<div class="sign-grid">${filtered.map(sign => `<article class="sign-card compact" tabindex="0" data-sign="${sign.id}"><div class="sign-id">#${String(sign.id).padStart(2, '0')}</div><div class="sign-image-shell">${image(sign)}</div><div class="sign-card-copy">${sign.category ? `<span class="category-chip">${esc(sign.category)}</span>` : ''}<h3>${esc(sign.vietnameseName)}</h3></div></article>`).join('')}</div>` : `<div class="empty-state"><span>⌕</span><h2>Không tìm thấy kết quả</h2><p>Thử một từ khóa hoặc bộ lọc khác.</p></div>`}</main>`
    document.querySelector('#library-search')?.addEventListener('input', event => { state.libraryQuery = event.target.value; renderLibrary(); requestAnimationFrame(() => { const next = document.querySelector('#library-search'); next?.focus(); next?.setSelectionRange(state.libraryQuery.length, state.libraryQuery.length) }) })
  }

  function learnList() {
    const query = state.learnQuery.toLocaleLowerCase('vi')
    return signs.filter(sign => { const stat = progress.signs[sign.id]; return (!query || [sign.vietnameseName, sign.explanation, sign.japaneseName || ''].join(' ').toLocaleLowerCase('vi').includes(query)) && (state.learnFilter === 'all' || (state.learnFilter === 'weak' ? stat.weak : stat.status === state.learnFilter)) })
  }
  function renderLearn() {
    const filtered = learnList()
    if (!filtered.some(sign => sign.id === state.learnId)) state.learnId = filtered[0]?.id
    const sign = filtered.find(item => item.id === state.learnId)
    if (!sign) { app.innerHTML = `<main class="learn-page"><div class="empty-state"><h2>Không có biển phù hợp</h2><p>Hãy đổi bộ lọc để tiếp tục học.</p><button class="secondary-button" data-action="clear-learn">Xóa bộ lọc</button></div></main>`; return }
    const index = filtered.findIndex(item => item.id === sign.id), stat = progress.signs[sign.id]
    app.innerHTML = `<main class="learn-page page-enter"><header class="learn-toolbar"><div><span class="eyebrow">CHẾ ĐỘ HỌC</span><h1>${state.flashcard ? 'Flashcard nhanh' : 'Hiểu từng biển báo'}</h1></div><button class="mode-toggle ${state.flashcard ? 'active' : ''}" data-action="flash"><span>◫</span>${state.flashcard ? 'Xem chi tiết' : 'Flashcard'}</button></header><div class="learn-controls"><label class="search-box"><span>⌕</span><input id="learn-search" value="${esc(state.learnQuery)}" placeholder="Tìm trong nội dung..."></label><select id="learn-filter"><option value="all">Tất cả trạng thái</option><option value="unseen">Chưa học</option><option value="learning">Đang học</option><option value="mastered">Đã thuộc</option><option value="weak">Biển yếu</option></select></div>${progressBar(index + 1, filtered.length, `Biển #${sign.id}`)}
    <section class="learn-card ${state.flashcard ? 'flashcard' : ''}" id="learn-card"><div class="learn-image-panel"><span class="sign-id">#${String(sign.id).padStart(2, '0')}</span>${image(sign)}<small>Vuốt để chuyển biển</small></div><div class="learn-copy">${state.flashcard && !state.revealed ? `<div class="flash-prompt"><span class="eyebrow">TỰ KIỂM TRA</span><h2>Biển này có ý nghĩa gì?</h2><button class="primary-button" data-action="reveal">Xem đáp án</button></div>` : `${sign.category ? `<span class="category-chip">${esc(sign.category)}</span>` : ''}<h2>${esc(sign.vietnameseName)}</h2>${sign.japaneseName ? `<p class="japanese-name">${esc(sign.japaneseName)}</p>` : ''}<div class="explanation large"><span>Giải thích</span><p>${esc(sign.explanation)}</p></div><div class="key-points"><span>Điểm cần nhớ</span>${sign.importantPoints.map(point => `<p><i>✓</i>${esc(point)}</p>`).join('')}</div><div class="status-actions"><button data-status="unseen" class="${stat.status === 'unseen' ? 'active' : ''}">Chưa thuộc</button><button data-status="learning" class="${stat.status === 'learning' ? 'active learning' : ''}">Đang học</button><button data-status="mastered" class="${stat.status === 'mastered' ? 'active mastered' : ''}">Đã thuộc</button></div>`}</div></section><div class="learn-nav"><button data-move="-1">← <span>Biển trước</span></button><span>${index + 1} / ${filtered.length}</span><button data-move="1"><span>Biển tiếp</span> →</button></div></main>`
    const filter = document.querySelector('#learn-filter'); if (filter) filter.value = state.learnFilter
    document.querySelector('#learn-search')?.addEventListener('change', event => { state.learnQuery = event.target.value; renderLearn() })
    filter?.addEventListener('change', event => { state.learnFilter = event.target.value; renderLearn() })
    let startX = 0
    document.querySelector('#learn-card')?.addEventListener('touchstart', event => { startX = event.touches[0].clientX }, { passive: true })
    document.querySelector('#learn-card')?.addEventListener('touchend', event => { const distance = event.changedTouches[0].clientX - startX; if (Math.abs(distance) > 55) moveLearn(distance < 0 ? 1 : -1) }, { passive: true })
  }
  function moveLearn(delta) { const filtered = learnList(), index = filtered.findIndex(sign => sign.id === state.learnId), next = filtered[(index + delta + filtered.length) % filtered.length]; if (next) { state.learnId = next.id; state.revealed = false; markViewed(next.id); renderLearn() } }

  const quizModes = [['quick','01','Quiz nhanh','10 câu','Một vòng ngắn để khởi động hoặc tranh thủ ôn nhanh.','blue'],['standard','02','Quiz tiêu chuẩn','20 câu','Bài luyện cân bằng, ưu tiên những biển bạn còn yếu.','coral'],['all','03','Quiz toàn bộ','33 câu','Đi qua toàn bộ dữ liệu, mỗi biển xuất hiện một lần.','green'],['random','04','Quiz ngẫu nhiên','Trộn toàn bộ','Thứ tự ngẫu nhiên cho một vòng luyện không đoán trước.','amber'],['truefalse','05','Đúng / Sai','10 câu','Đối chiếu hình với phát biểu lấy từ dữ liệu thật.','violet'],['wrong','06','Ôn câu sai','Theo lịch sử','Chỉ hỏi lại những biển bạn đã từng trả lời sai.','red'],['weak','07','Ôn biển yếu','Có trọng số','Tập trung vào những biển có số lần sai cao.','ink']]
  function renderSetup() {
    const weak = Object.values(progress.signs).filter(item => item.weak).length
    app.innerHTML = `<main class="setup-page page-enter"><header class="page-title"><span class="eyebrow">LUYỆN TẬP</span><h1>Chọn một kiểu quiz</h1><p>Sau mỗi câu, đáp án và giải thích đầy đủ sẽ hiện ngay.</p></header><div class="mode-grid">${quizModes.map(([mode,number,title,meta,description,tone]) => { const disabled = mode === 'wrong' && !progress.wrongIds.length || mode === 'weak' && !weak; return `<button class="mode-card ${tone}" data-quiz="${mode}" ${disabled ? 'disabled' : ''}><span class="mode-number">${number}</span><div class="mode-icon">${mode === 'truefalse' ? '✓×' : mode === 'weak' ? '!' : '↗'}</div><h2>${title}</h2><strong>${disabled ? 'Chưa có dữ liệu' : meta}</strong><p>${description}</p><span class="mode-arrow">Bắt đầu <b>→</b></span></button>` }).join('')}</div></main>`
  }
  function weightFor(sign) { const stats = progress.signs[sign.id]; if (!stats || stats.correctCount + stats.wrongCount === 0) return 3; if (stats.weak) return 7; if (stats.wrongCount) return 5; if (stats.mastered) return 1; return 2 }
  function weightedUnique(pool, count) { const available = [...pool], picked = []; while (available.length && picked.length < count) { const total = available.reduce((sum, sign) => sum + weightFor(sign), 0); let cursor = Math.random() * total, index = 0; for (; index < available.length - 1; index++) { cursor -= weightFor(available[index]); if (cursor <= 0) break } picked.push(available.splice(index, 1)[0]) } return picked }
  function distractors(target) { const unique = list => [...new Map(list.map(sign => [sign.vietnameseName, sign])).values()]; const same = unique(signs.filter(sign => sign.id !== target.id && sign.category === target.category && sign.vietnameseName !== target.vietnameseName)); const other = unique(signs.filter(sign => sign.id !== target.id && sign.category !== target.category && sign.vietnameseName !== target.vietnameseName)); return [...shuffle(same), ...shuffle(other)].slice(0, 3).map(sign => sign.vietnameseName) }
  function startQuiz(mode) {
    let pool = signs
    if (mode === 'wrong') pool = signs.filter(sign => progress.wrongIds.includes(sign.id))
    if (mode === 'weak') pool = signs.filter(sign => progress.signs[sign.id].weak)
    const wanted = mode === 'quick' || mode === 'truefalse' ? 10 : mode === 'standard' ? 20 : pool.length
    const selected = mode === 'all' ? [...pool] : mode === 'random' ? shuffle(pool).slice(0, wanted) : weightedUnique(pool, wanted)
    state.questions = selected.map(sign => {
      if (mode !== 'truefalse') return { sign, correctAnswer: sign.vietnameseName, options: shuffle([sign.vietnameseName, ...distractors(sign)]) }
      const isTrue = Math.random() >= .5
      const candidates = signs.filter(item => item.id !== sign.id && item.vietnameseName !== sign.vietnameseName && item.category === sign.category)
      const other = shuffle(candidates.length ? candidates : signs.filter(item => item.id !== sign.id && item.vietnameseName !== sign.vietnameseName))[0]
      return { sign, statement: `Hình này có nghĩa là “${isTrue ? sign.vietnameseName : other.vietnameseName}”.`, correctAnswer: isTrue ? 'Đúng' : 'Sai', options: ['Đúng','Sai'] }
    })
    state.quizIndex = 0; state.selected = null; state.answers = []; setView('quiz')
  }
  function renderQuiz() {
    if (!state.questions.length) { app.innerHTML = `<main class="quiz-page"><div class="empty-state"><h2>Chưa có câu hỏi phù hợp</h2><button class="primary-button" data-view="setup">Chọn quiz khác</button></div></main>`; return }
    const question = state.questions[state.quizIndex], answered = state.selected !== null, correct = state.selected === question.correctAnswer
    app.innerHTML = `<main class="quiz-page"><button class="quiz-close" data-view="setup" aria-label="Thoát quiz">×</button><section class="quiz-card page-enter"><div class="quiz-topline"><span>Câu ${state.quizIndex + 1} / ${state.questions.length}</span><span>${question.statement ? 'Đúng / Sai' : '4 lựa chọn'}</span></div><div class="question-progress"><span style="width:${(state.quizIndex + (answered ? 1 : 0)) / state.questions.length * 100}%"></span></div><div class="quiz-image">${image(question.sign)}</div><h2>${esc(question.statement || 'Biển/tín hiệu này có ý nghĩa gì?')}</h2><div class="answer-grid ${question.statement ? 'binary' : ''}">${question.options.map((option,index) => { const status = answered ? option === question.correctAnswer ? 'correct' : option === state.selected ? 'wrong' : 'muted' : ''; return `<button class="answer-option ${status}" data-answer="${esc(option)}" ${answered ? 'disabled' : ''}><span>${question.statement ? option === 'Đúng' ? '✓' : '×' : String.fromCharCode(65 + index)}</span>${esc(option)}</button>` }).join('')}</div>${answered ? `<div class="feedback ${correct ? 'success' : 'error'}"><div class="feedback-title"><span>${correct ? '✓' : '×'}</span><strong>${correct ? 'CHÍNH XÁC' : 'CHƯA ĐÚNG'}</strong></div>${correct ? '' : `<p>Bạn chọn: <strong>${esc(state.selected)}</strong></p>`}<p>Đáp án đúng: <strong>${esc(question.correctAnswer)}</strong></p><div class="explanation"><span>Giải thích</span><p>${esc(question.sign.explanation)}</p></div><button class="primary-button next-button" data-action="next">${state.quizIndex + 1 === state.questions.length ? 'Xem kết quả' : 'Câu tiếp theo'} <span>→</span></button></div>` : ''}</section></main>`
  }
  function chooseAnswer(answer) { if (state.selected !== null) return; const question = state.questions[state.quizIndex], correct = answer === question.correctAnswer; state.selected = answer; state.answers.push({ sign: question.sign, selected: answer, correctAnswer: question.correctAnswer, isCorrect: correct }); recordAnswer(question.sign.id, correct); renderQuiz() }
  function nextQuestion() { if (state.quizIndex + 1 >= state.questions.length) setView('results'); else { state.quizIndex++; state.selected = null; renderQuiz() } }
  function renderResults() {
    const correct = state.answers.filter(item => item.isCorrect).length, wrong = state.answers.length - correct, score = state.answers.length ? Math.round(correct / state.answers.length * 100) : 0
    app.innerHTML = `<main class="result-page page-enter"><section class="result-hero"><span class="eyebrow">KẾT QUẢ</span><div class="score-ring" style="--score:${score * 3.6}deg"><div><strong>${score}%</strong><span>${correct} / ${state.answers.length}</span></div></div><div class="result-counts"><span class="correct-text">✓ Đúng: ${correct}</span><span class="wrong-text">× Sai: ${wrong}</span></div><div class="result-actions"><button class="primary-button" data-action="retry-current" ${wrong ? '' : 'disabled'}>Làm lại câu sai</button><button class="secondary-button" data-view="setup">Quiz mới</button><button class="ghost-button" data-view="home">Về trang chủ</button></div></section>${wrong ? `<section class="mistake-section"><div class="section-heading"><div><span class="eyebrow">XEM LẠI</span><h2>Những câu cần ôn</h2></div><span>${wrong} câu</span></div><div class="mistake-list">${state.answers.filter(item => !item.isCorrect).map(item => `<article class="mistake-card">${image(item.sign)}<div><span class="sign-id">#${String(item.sign.id).padStart(2,'0')}</span><h3>${esc(item.sign.vietnameseName)}</h3><p class="wrong-answer">Bạn chọn: ${esc(item.selected)}</p><p>Đáp án đúng: <strong>${esc(item.correctAnswer)}</strong></p><div class="explanation"><span>Giải thích</span><p>${esc(item.sign.explanation)}</p></div></div></article>`).join('')}</div></section>` : ''}</main>`
  }
  function render() { if (state.view === 'home') renderHome(); else if (state.view === 'library') renderLibrary(); else if (state.view === 'learn') renderLearn(); else if (state.view === 'setup') renderSetup(); else if (state.view === 'quiz') renderQuiz(); else renderResults() }

  document.addEventListener('click', event => {
    const target = event.target.closest('button, [data-sign]')
    if (!target || target.disabled) return
    if (target.dataset.view) setView(target.dataset.view)
    else if (target.dataset.action === 'learn') { state.learnId = signs[0].id; markViewed(state.learnId); setView('learn') }
    else if (target.dataset.action === 'clear-learn') { state.learnQuery = ''; state.learnFilter = 'all'; renderLearn() }
    else if (target.dataset.action === 'flash') { state.flashcard = !state.flashcard; state.revealed = false; renderLearn() }
    else if (target.dataset.action === 'reveal') { state.revealed = true; renderLearn() }
    else if (target.dataset.action === 'next') nextQuestion()
    else if (target.dataset.action === 'retry-current') {
      const retrySigns = state.answers.filter(item => !item.isCorrect).map(item => item.sign)
      state.questions = retrySigns.map(sign => ({ sign, correctAnswer: sign.vietnameseName, options: shuffle([sign.vietnameseName, ...distractors(sign)]) }))
      state.quizIndex = 0; state.selected = null; state.answers = []; setView('quiz')
    }
    else if (target.dataset.quiz) startQuiz(target.dataset.quiz)
    else if (target.dataset.sign) { state.learnId = Number(target.dataset.sign); markViewed(state.learnId); setView('learn') }
    else if (target.dataset.category) { state.libraryCategory = target.dataset.category; renderLibrary() }
    else if (target.dataset.move) moveLearn(Number(target.dataset.move))
    else if (target.dataset.status) { setStatus(state.learnId, target.dataset.status); renderLearn() }
    else if (target.dataset.answer) chooseAnswer(target.dataset.answer)
  })
  document.addEventListener('keydown', event => { const card = event.target.closest?.('[data-sign]'); if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); card.click() } })
  render()
})()
