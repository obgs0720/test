// 將真正題目填入這個陣列即可：{ id, question, options: [], answer: 0 }
const QUESTION_BANK = window.QUESTION_BANK || [];
const STORAGE_KEY = 'wda-quiz-progress-v1';
const state = { quiz: [], answers: {}, progress: loadProgress(), submitted: false };
const $ = (id) => document.getElementById(id);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { seen: [], correct: [] }; } catch { return { seen: [], correct: [] }; } }
function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress)); }
function selectQuiz() {
  if (QUESTION_BANK.length === 0) return [];
  const allIds = QUESTION_BANK.map(q => q.id);
  if (allIds.every(id => state.progress.seen.includes(id))) { state.progress.seen = []; state.progress.correct = []; saveProgress(); }
  const unseen = QUESTION_BANK.filter(q => !state.progress.seen.includes(q.id));
  const wrongPractice = QUESTION_BANK.filter(q => !state.progress.correct.includes(q.id));
  return shuffle([...unseen, ...wrongPractice.filter(q => !unseen.some(u => u.id === q.id))]).slice(0, 10);
}
function renderQuiz() {
  state.quiz = selectQuiz(); state.answers = {}; state.submitted = false;
  $('emptyState').hidden = QUESTION_BANK.length > 0; $('quizView').hidden = QUESTION_BANK.length === 0; $('resultView').hidden = true;
  if (!state.quiz.length) return;
  $('progressText').textContent = `0 / ${state.quiz.length}`; $('progressBar').style.width = '0%';
  $('questionList').innerHTML = state.quiz.map((q, index) => `<article class="question-card"><div class="question-number">QUESTION ${String(index+1).padStart(2,'0')}</div><h3 class="question-title">${escapeHtml(q.question)}</h3><div class="options">${q.options.map((option, i) => `<label class="option"><input type="radio" name="q-${q.id}" value="${i}" data-question="${q.id}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span class="option-text">${escapeHtml(option)}</span></label>`).join('')}</div></article>`).join('');
  document.querySelectorAll('input[type=radio]').forEach(input => input.addEventListener('change', (event) => { state.answers[event.target.dataset.question] = Number(event.target.value); const count = Object.keys(state.answers).length; $('progressText').textContent = `${count} / ${state.quiz.length}`; $('progressBar').style.width = `${count/state.quiz.length*100}%`; }));
}
function submitQuiz() {
  const unanswered = state.quiz.length - Object.keys(state.answers).length;
  if (unanswered > 0 && !confirm(`還有 ${unanswered} 題未作答，確定要送出嗎？`)) return;
  let score = 0; state.quiz.forEach(q => { state.progress.seen.push(q.id); if (state.answers[q.id] === q.answer) { score++; if (!state.progress.correct.includes(q.id)) state.progress.correct.push(q.id); } });
  state.progress.seen = [...new Set(state.progress.seen)]; saveProgress(); $('quizView').hidden = true; $('resultView').hidden = false; $('scoreText').textContent = `${score} / ${state.quiz.length}`; $('scoreMessage').textContent = score === state.quiz.length ? '全部答對，太棒了！' : '以下是本回合需要再練習的題目。';
  const wrongQuestions = state.quiz.map((q, i) => ({ q, i })).filter(({ q }) => state.answers[q.id] !== q.answer);
  $('reviewList').innerHTML = wrongQuestions.length ? wrongQuestions.map(({ q, i }) => `<article class="review-card"><div class="review-head"><div><div class="question-number">QUESTION ${String(i+1).padStart(2,'0')}</div><h3 class="review-title">${escapeHtml(q.question)}</h3></div><span class="badge wrong">答錯</span></div><p class="answer-note">正確答案：<strong>${String.fromCharCode(65+q.answer)}. ${escapeHtml(q.options[q.answer])}</strong></p></article>`).join('') : '<p class="all-correct">本回合沒有錯題，全部答對！</p>'; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
$('submitQuiz').addEventListener('click', submitQuiz); $('nextQuiz').addEventListener('click', renderQuiz); $('resetProgress').addEventListener('click', () => { if (confirm('確定要清除所有答題紀錄嗎？')) { state.progress = { seen: [], correct: [] }; saveProgress(); renderQuiz(); } }); renderQuiz();

