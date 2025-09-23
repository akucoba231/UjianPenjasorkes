alert('Server dalam perawatan, akses dibatasi, nilai 5');
// untuk info ujian
let ujian;
// untuk menampung pertanyaan
let questionsData = [];

// untuk menampung nilai
let scores = [];

let datadiri = {};

let id_lembar_ujian = 0;
let id_lembar_ujian_change = 0;

// Fungsi untuk membuat elemen soal
function createQuestionElement(questionObj) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.id = `q${questionObj.id}`;
    let nomor = questionsData.indexOf(questionObj);
    nomor = parseInt(nomor);
    questionDiv.innerHTML = `
        <h3>Soal ${(nomor + 1)}: ${questionObj.judul_soal}</h3>
        <p>${questionObj.rincian}</p>
        <textarea id="answer${nomor}" placeholder="Tulis jawaban Anda di sini..."></textarea>
        <button onclick="evaluateAnswer(${nomor})" id="tombolEvaluasi${nomor}">Evaluasi Jawaban</button>
        <div class="loading" id="loading${nomor}">Menganalisis jawaban</div>
        <div class="result" id="result${nomor}"></div>
    `;
    //console.log(nomor);

    return questionDiv;
}

// Fungsi evaluasi jawaban
function evaluateAnswer(questionNum) {
    //console.log(questionNum)
    const questionIndex = questionNum;
    const question = questionsData[questionIndex];
    //console.log(question)
    let questionLength = question.ideal.length;
    const answerElement = document.getElementById(`answer${questionNum}`);
    const resultElement = document.getElementById(`result${questionNum}`);
    const loadingElement = document.getElementById(`loading${questionNum}`);
    const tombolEvaluasi = document.getElementById(`tombolEvaluasi${questionNum}`);
    const answer = answerElement.value.trim();

    questionLength = Math.floor(questionLength * 1);

    //persiapan jawaban untuk dikirim
    let tmpDataJawaban = {
        "id_jawaban": 0,
        "id_lembar_ujian": id_lembar_ujian,
        "id_soal": question.id,
        "judul_soal": question.judul_soal,
        "jawaban": answer,
        "score": 0
    }

    if (!answer) {
        alert("Silakan tulis jawaban terlebih dahulu!");
        return;
    }
    else {
        tombolEvaluasi.setAttribute('disabled', '');
        tombolEvaluasi.setAttribute('class', 'disabled');
    }

    loadingElement.style.display = "block";
    resultElement.style.display = "none";

    setTimeout(() => {
        loadingElement.style.display = "none";
        let nilaiNLP = 0;
        nilaiNLP = getNilaiNLP(question.ideal, answer);
        if (!Array.isArray(question.keyword)) {
            question.keyword = question.keyword.split(',');
        }
        let keywordCount = 0;
        question.keyword.forEach(keyword => {
            if (answer.toString().toLowerCase().includes(keyword.toLowerCase().trim())) {
                keywordCount++;
                //console.log(keyword);
            }
        });
        if(nilaiNLP <= 0){
            // do not do anything
            answerElement.focus();
            tombolEvaluasi.removeAttribute('disabled');
            tombolEvaluasi.removeAttribute('class');
        }
        else {
            const keywordScore = (keywordCount / question.keyword.length) * 30; //tadinya 50
            const lengthScore = Math.min((answer.length / questionLength) * 40, 40); // tadinya 30

        const answerMatch = (nilaiNLP) * 30; //tadinya 20 Math.random() * 20; //ini untuk NLP ideal answer: (key) : ideal 

        //jsonCheck(question.ideal);

        const score = Math.min(Math.round(keywordScore + lengthScore + answerMatch), 100);
        console.log(score)
        console.log(keywordScore)
        console.log(typeof keywordScore)
        console.log(lengthScore)
        console.log(typeof lengthScore)
        console.log(answerMatch)
        console.log(typeof answerMatch)
        tmpDataJawaban['score'] = score

        scores[questionIndex] = score;

        let feedback = "";
        let resultClass = "";

        if (score >= 80) {
            resultClass = "correct";
            feedback = "Jawaban sangat baik! Anda telah mencakup sebagian besar konsep penting dengan analisis yang mendalam.";
        } else if (score >= 60 && score < 80) {
            resultClass = "partial";
            feedback = "Jawaban cukup baik, tetapi masih bisa diperdalam dengan menambahkan lebih banyak analisis dan istilah teknis.";
        } else if (score < 60){
            resultClass = "incorrect";
            feedback = "Jawaban masih perlu pengembangan. Perhatikan kembali konsep dasar dan sertakan lebih banyak analisis.";
        }

        resultElement.className = `result ${resultClass}`;
        resultElement.innerHTML = `
            <h4>Skor: ${score}/100</h4>
            <div class="feedback">${feedback}</div>
            <p><strong>Nilai panjang jawaban</strong> ${(lengthScore / 30) * 100}%</p>
            <p><strong>Kata kunci yang ditemukan:</strong> ${(keywordCount / question.keyword.length) * 100}%</p>
            <p><strong>Kesesuaian jawaban (NLP):</strong> ${(answerMatch / 20) * 100}%</p>
            <div class="advice-section">
        `;
        if (score < 60) {
            resultElement.innerHTML += `
                <div class="advice-box">
                    <h5>Nasihat untuk Perbaikan:</h5>
                    <p>${question.nasihat}</p>
                </div>
            `;
        }
        else if (score >= 60 && score < 80 ) {
            resultElement.innerHTML += `
                <div class="advice-box">
                    <h5>Nasihat untuk Perbaikan:</h5>
                    <p>${question.cukup}</p>
                </div>
            `;
        }
        else {
            resultElement.innerHTML += `
                <div class="advice-box">
                    <h5>Saran untuk Pengembangan:</h5>
                    <p>${question.saran}</p>
                </div>
            `;
        }

        resultElement.innerHTML += `
            </div>
        `;
        resultElement.style.display = "block";

        updateTotalScore(tmpDataJawaban);
    }
}, 1500);
}

//let test;
const akhiriUjian = document.getElementById('akhiriUjian');
akhiriUjian.addEventListener('click',(e)=>{

    confirm('Akhiri ujian sekarang ?') ? finish() : "";
})

// Fungsi lainnya tetap sama...
function updateTotalScore(dataJawaban) {
    const totalScoreElement = document.getElementById('total-score');
    const scoreFeedbackElement = document.getElementById('score-feedback');
    const totalScoreDisplay = document.getElementById('score-display');
    
    let totalScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    akhiriUjian.parentNode.style.display = "block";
    //test = akhiriUjian;

    totalScoreElement.textContent = Math.round(totalScore);

    if (totalScore >= 80) {
        scoreFeedbackElement.textContent = "Kinerja luar biasa! Anda menunjukkan pemahaman mendalam tentang konsep PJOK.";
    } else if (totalScore >= 60 && totalScore < 80) {
        scoreFeedbackElement.textContent = "Hasil baik! Beberapa aspek masih bisa ditingkatkan dengan analisis lebih mendalam.";
    } else {
        scoreFeedbackElement.textContent = "Perlu peningkatan. Tinjau kembali materi dan fokus pada analisis konsep kunci.";
    }

    totalScoreDisplay.style.display = "block";

    kirimJawaban(dataJawaban);
    // cek apakah semua jawaban sudah bernilai
    let send = scores;
    let ok = send.every((e)=> e > 0); // ini akan memeriksa nilai setiap item scores, jika ada satu saja nilai 0, nilainya false
    if (ok === true) {
        setTimeout(() => {
            updateNilai(scores);
        }, 1000);
    }
}

// Inisialisasi saat halaman dimuat
window.onload = function () {
    //getSoal();
    //cekAktif("PJOK-JAYA");
    cekAktif(getToken());
};

//const api = new ApiService();
//console.log(api)

// fungsi update questions 
function writeQuestion() {
    const container = document.getElementById('questions-container');
    const noSoal = document.getElementById('no-soal');

    scores = new Array(questionsData.length).fill(0);

    document.getElementById('score-display').style.display = 'none';

    if (questionsData.length > 0) {
        noSoal.classList.replace('ns-active', 'ns-gone');
        questionsData.forEach(question => {
            container.appendChild(createQuestionElement(question));
        });
    }
    else {
        noSoal.classList.replace('ns-gone', 'ns-active');
    }
}

//untuk menyiapkan pesan error 

const errMsg = document.getElementById('err-msg');

// delay helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// untuk memeriksa ujian aktif 
async function cekAktif(token) {
    loadScreen();
    const target = 'tema';
    const apisoal = new ApiService();
    apisoal.setUrl(url + target).setMethod('GET').addHeader('x-apikey', myapi);

    console.log(apisoal)

    try {
         // delay acak 0–3000ms supaya tidak semua client barengan
        const delay = Math.floor(Math.random() * 3000);
        await sleep(delay);
        
        const result = await apisoal.execute();
        //console.log(result);
        //console.log("result zero : " + JSON.stringify(result[0]));
        if (result.length <= 0) {
            errMsg.textContent = "Ujian tidak ditemukan";
            setTimeout(() => {
                writeQuestion();
            }, 1000);
        }
        else {
          let tmp = result.filter(item => item.token == token)
          if(tmp.length > 0){
            ujian = tmp[0];
            if(ujian.status != "Aktif") {
                alert("Ujian tidak aktif! Silakan hubungi Admin.");
                forbidden("Ujian tidak aktif");
            }
            else {
                setJudulUjian(ujian.judul, ujian.deskripsi);
                setBanner(ujian.banner);
                loadScreen();
                getSoal();
                login(ujian.id, ujian.judul); 
            }
        }
        else {
         forbidden("Anda tidak memiliki akses ke halaman ini");
     }
 }
} catch (error) {
    console.error('Gagal:', error);
    errMsg.textContent = "error: " + error;
}
}

// untuk mendapatkan soal
async function getSoal() {
    loadScreen();
    const target = 'soal';
    const apisoal = new ApiService();
    apisoal.setUrl(url + target).setMethod('GET').addHeader('x-apikey', myapi);

    console.log(apisoal)

    try {
        const result = await apisoal.execute();
        console.log(result);
        let tmp = result.filter(item => item.id_tema == ujian.id);
        questionsData = tmp;
        loadScreen();
    } catch (error) {
        console.error('Gagal:', error);
        errMsg.textContent = error;
    }
    writeQuestion();
}

// fungsi untuk  total nilai ujian 
function uploadNilai(total) {
    errMsg.textContent = "Sedang mengirim nilai ke server, mohon tunggu..."

    if (total > 0) {
        datadiri['total_score'] = total;
        
        datadiri['tanggal'] = thisTime();
        //console.log(datadiri)
        sendToServer(datadiri);
    }
    else {
        alert('score: error');
    }

}

// untuk menambahkan loadscreen
function loadScreen() {
    const load_screen = document.getElementById('load-screen');
    if (load_screen.classList.contains('ns-active')) {
        load_screen.classList.replace('ns-active', 'ns-gone');
    }
    else {
        load_screen.classList.replace('ns-gone', 'ns-active');
    }
}

//nlp ini akan memeriksa kesesuaian jawaban dengan jawaban ideal

function getNilaiNLP(referenceData, value) {
    //referenceData = JSON.parse(JSON.stringify(referenceData));
    referenceData = cleanTextFromWord(referenceData);
    value = cleanTextFromWord(value)
    const options = {
        keys: ['text'],
        includeScore: true,
        includeMatches: true,
        threshold: 0.6,
        minMatchCharLength: 2,
        ignoreLocation: true,
        findAllMatches: true
    };

    let tmp = [
        {
            "text": referenceData
        }
    ];

    // Initialize Fuse
    fuse = new Fuse(tmp, options);
    // Run search
    try {
        let results = fuse.search(value);
        results = results[0];
        return (1 - results.score);
    } catch (e) {
        alert('Mohon dijawab dengan benar');
        return 0;
    }
}

// JSON parse checker
function jsonCheck(string) {
    console.log(string);
    console.log(typeof string);

    let tmp = [
        {
            "text": string
        }
    ];
    try {
        tmp = JSON.parse(JSON.stringify(tmp));
        console.log(tmp);
    } catch (e) {
        console.log(e)
    }
}

// fungsi setting judul Ujian

function setJudulUjian(jud, desk) {
    let judul = document.getElementById('judul-ujian');
    let deskripsi = document.getElementById('deskripsi-ujian');

    judul.textContent = jud;

    console.log(desk);

    deskripsi.innerHTML = `
        <p>${desk}</p>
    `;
}

// login handle
function login(id_tema, judul_tema) {
    // menampilkan form login
    let loginForm = document.getElementById('login');
    loginForm.classList.replace('l-disabled', 'l-active');

    // memasukan id ujian
    let idTema = document.getElementById('id_tema');
    let judulTema = document.getElementById('judul_tema');
    idTema.value = id_tema;
    judulTema.value = judul_tema;

    // simpan data
    //let submit = document.getElementById('submit'); // diganti form
    let form = document.getElementById('form');
    let input = document.getElementsByClassName('datadiri');

/* // fungsi submit sebelumnya diganti form
    submit.addEventListener('click', (e) => {
        for (let item of input) {
            datadiri[item.getAttribute('id')] = item.value;
        }

        loginForm.classList.replace('l-active', 'l-disabled');
        cekNamaEmail(ujian.id, datadiri.nama, datadiri.email);
        //uploadNilai(1);
    })
*/
    form.addEventListener('submit',(e)=>{
        e.preventDefault();

        for (let item of input) {
            datadiri[item.getAttribute('id')] = item.value;
        }

        loginForm.classList.replace('l-active', 'l-disabled');
        cekNamaEmail(ujian.id, datadiri.nama, datadiri.email);
    })
}


// send data ke server
async function sendToServer(data) {
    loadScreen();

    let settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "lembarujian",
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": JSON.stringify(data)
    }
    // delay acak 0–3000ms supaya tidak semua client barengan
    const delay = Math.floor(Math.random() * 3000);
    //await sleep(delay);

    setTimeout(()=>{
    $.ajax(settings).done(function (response) {
        console.log(response);
        id_lembar_ujian = response.id_lembar_ujian;
        id_lembar_ujian_change = response._id;
        loadScreen();
    }).fail(function (e) {
        errMsg.textContent = "error: " + JSON.stringify(e);
    });
    }, delay);
}

// send jawaban ke server
function kirimJawaban(jawaban) {
    //loadScreen()
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "jawaban",
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": JSON.stringify(jawaban)
    }

    // delay acak 0–3000ms supaya tidak semua client barengan
    const delay = Math.floor(Math.random() * 3000);
    //await sleep(delay);

    setTimeout(()=>{
    $.ajax(settings).done(function (response) {
        console.log(response);
        //loadScreen();
    }).fail(function (e) {
        errMsg.textContent = "error: " + JSON.stringify(e);
    });
    }, delay);

}

function updateNilai(newTotal) {
    loadScreen()
    newTotal = newTotal.reduce((a, b) => a + b, 0) / scores.length;
    let tmpKirim = {
        "total_score": newTotal,
    }
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "lembarujian/" + id_lembar_ujian_change,
        "method": "PUT",
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": JSON.stringify(tmpKirim)
    }

    // delay acak 0–3000ms supaya tidak semua client barengan
    const delay = Math.floor(Math.random() * 3000);
    //await sleep(delay);

    setTimeout(()=>{
    $.ajax(settings).done(function (response) {
        console.log(response);
        loadScreen();
    }).fail((e) => {
        errMsg.textContent = "error: " + e.toString();
    })
    }, delay);
}

function thisTime(){
  let ts = new Date();
  let tsMonth = ts.getMonth()+1;
  tsMonth = tsMonth.toString();
  tsMonth = tsMonth.length > 1 ? tsMonth : `0${tsMonth}`;
  let tsDate = ts.getDate()
  tsDate = tsDate.toString().length > 1 ? tsDate : `0${tsDate}`;

  let timestamp = ts.getFullYear() + '/' + tsMonth + '/' + tsDate + ' ' + ts.getHours() + ':' + ts.getMinutes() + ':' + ts.getSeconds();
  
  return timestamp;
}

function forbidden(pesan){
  
  window.location.href = "forbidden.html?pesan=" + encodeURI(pesan);
}

function getToken(){
  let tmp = window.location.href;
  tmp = tmp.split('?token=');
  if(tmp.length > 1){
      return tmp[1];
  }
  else {
    forbidden("Token ujian tidak valid");
}
}

function cleanTextFromWord(text) {
    if (typeof text !== 'string') {
        return ''; // Pastikan input adalah string
    }

    // Langkah 1: Normalisasi karakter newline
    // Ms. Word di Windows sering menggunakan '\r\n' (CRLF) untuk newline.
    // Web (textarea) umumnya menggunakan '\n' (LF).
    // Jadi, kita konversi semua '\r\n' atau '\r' menjadi '\n' tunggal.
    let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Langkah 2: Ganti karakter tab (\t) dengan spasi
    // Tab bisa jadi masalah jika Anda ingin semua spasi menjadi konsisten.
    cleaned = cleaned.replace(/\t/g, ' ');

    // Langkah 3: Hapus spasi berlebih di awal/akhir setiap baris
    // Ms. Word bisa menyisakan spasi di akhir baris, atau baris kosong.
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

    // Langkah 4: Hapus baris-baris kosong berlebih
    // Jika ada banyak baris kosong karena format Word, ini akan membersihkannya.
    cleaned = cleaned.replace(/\n\s*\n/g, '\n'); // Ganti 2 atau lebih newline dengan 1 newline jika di antaranya hanya ada spasi
    cleaned = cleaned.replace(/^\s*\n/gm, ''); // Hapus baris kosong di awal dokumen
    cleaned = cleaned.replace(/\n\s*$/gm, ''); // Hapus baris kosong di akhir dokumen

    // Langkah 5: Ganti spasi ganda menjadi spasi tunggal
    // Ini membantu jika ada spasi berlebih yang tidak diinginkan di dalam teks.
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Langkah 6: Normalisasi karakter Unicode (opsional tapi direkomendasikan)
    // Ms. Word sering menggunakan karakter "smart quotes" (‘ ’ “ ”) dan em-dashes (—)
    // yang berbeda dari karakter ASCII standar (' " -). Ini bisa menyebabkan ketidakcocokan.
    cleaned = cleaned.replace(/[\u2018\u2019]/g, "'"); // Smart single quotes
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
    cleaned = cleaned.replace(/[\u2013\u2014]/g, '-'); // En/Em dashes
    cleaned = cleaned.replace(/[\u2026]/g, '...');   // Ellipsis
    cleaned = cleaned = cleaned.normalize("NFC"); // Normalisasi bentuk Unicode (misalnya, karakter dengan diakritik)

    // Langkah 7: Hapus spasi di awal dan akhir keseluruhan string
    cleaned = cleaned.trim();

    return cleaned;
}

function setBanner(base64){
    let banner = document.getElementById('banner');
    if(base64 == "" || base64.length < 5){
        // do nothing
        banner.parentNode.style.display = "none";
    }
    else {
        banner.parentNode.style.display = "block";
        banner.src = base64;
    }
}

function finish(){
    let akhir = document.body;
    let totalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    totalScore = Math.round(totalScore*100);
    totalScore = totalScore/100;
    akhir.setAttribute('class','bodyClass');
    akhir.innerHTML = "";
    akhir.innerHTML = `
    <div class="finish-container">
        <h2>Ujian Selesai</h2>
        <p>Terima kasih, <span>${datadiri.nama}</span> telah mengerjakan ujian dengan baik.</p>
        <p>Nilai akhir Anda : <span id="nilai">${totalScore}</span></p>
    </div>

    `;
}

function cekNamaEmail(id_tema = 0, nama = "", email = ""){ //bisa ditambahkan email nanti
    loadScreen()

    let search = {};
    search["id_tema"] = ujian.id

    if(email == ""){
        search["nama"] = nama;
    }
    else {
        search["email"] = email;
    }

    search = JSON.stringify(search).replace(/\\"/g,'');

    let carilembarujian = "lembarujian";
    if(slimFr == true){
        carilembarujian = carilembarujian + "/";
    }
    let settings = {
        "async": true,
        "crossDomain": true,
        "url": url + carilembarujian + "?q=" + search,
        "method": "GET",
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": null
    }

    console.log(settings.url);

    // delay acak 0–3000ms supaya tidak semua client barengan
    const delay = Math.floor(Math.random() * 3000);
    //await sleep(delay);
    setTimeout(()=>{
    $.ajax(settings).done(function (response) {
        console.log(response);
        if(response.length >= 1){
            errMsg.textContent = "error: Akses dibatasi";
            alert("Anda telah mengerjakan ujian ini, tidak dapat mengerjakan ujian ulang");
            forbidden("Tidak diperbolehkan mengerjakan ujian dua kali.");
        }
        else {
            loadScreen();
            uploadNilai(1);
        }
        
    }).fail(function (e) {
        errMsg.textContent = "error: " + JSON.stringify(e);
    });
    }, delay);
}
