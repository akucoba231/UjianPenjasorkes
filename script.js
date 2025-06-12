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

        const keywordScore = (keywordCount / question.keyword.length) * 50;
        const lengthScore = Math.min((answer.length / questionLength).toFixed(4) * 30, 30);

        const answerMatch = (getNilaiNLP(question.ideal, answer)) * 20; //Math.random() * 20; //ini untuk NLP ideal answer: (key) : ideal 

        //jsonCheck(question.ideal);

        const score = Math.min(Math.round(keywordScore + lengthScore + answerMatch), 100);
        
        tmpDataJawaban['score'] = score

        scores[questionIndex] = score;

        let feedback = "";
        let resultClass = "";

        if (score >= 80) {
            resultClass = "correct";
            feedback = "Jawaban sangat baik! Anda telah mencakup sebagian besar konsep penting dengan analisis yang mendalam.";
        } else if (score >= 50) {
            resultClass = "partial";
            feedback = "Jawaban cukup baik, tetapi masih bisa diperdalam dengan menambahkan lebih banyak analisis dan istilah teknis.";
        } else {
            resultClass = "incorrect";
            feedback = "Jawaban masih perlu pengembangan. Perhatikan kembali konsep dasar dan sertakan lebih banyak analisis.";
        }

        resultElement.className = `result ${resultClass}`;
        resultElement.innerHTML = `
            <h4>Skor: ${score}/100</h4>
            <div class="feedback">${feedback}</div>
            <p><strong>Nilai panjang jawaban</strong> ${(lengthScore / 30).toFixed(4) * 100}%</p>
            <p><strong>Kata kunci yang ditemukan:</strong> ${(keywordCount / question.keyword.length).toFixed(4) * 100}%</p>
            <p><strong>Kesesuaian jawaban (NLP):</strong> ${(answerMatch / 20).toFixed(4) * 100}%</p>
            <div class="advice-section">
            `;
        if (score < 70) {
            resultElement.innerHTML += `
                <div class="advice-box">
                    <h5>Nasihat untuk Perbaikan:</h5>
                    <p>${question.nasihat}</p>
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
    }, 1500);
}

// Fungsi lainnya tetap sama...
function updateTotalScore(dataJawaban) {
    const totalScoreElement = document.getElementById('total-score');
    const scoreFeedbackElement = document.getElementById('score-feedback');
    const totalScoreDisplay = document.getElementById('score-display');

    const totalScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    totalScoreElement.textContent = Math.round(totalScore);

    if (totalScore >= 80) {
        scoreFeedbackElement.textContent = "Kinerja luar biasa! Anda menunjukkan pemahaman mendalam tentang konsep PJOK.";
    } else if (totalScore >= 60) {
        scoreFeedbackElement.textContent = "Hasil baik! Beberapa aspek masih bisa ditingkatkan dengan analisis lebih mendalam.";
    } else {
        scoreFeedbackElement.textContent = "Perlu peningkatan. Tinjau kembali materi dan fokus pada analisis konsep kunci.";
    }

    totalScoreDisplay.style.display = "block";

    kirimJawaban(dataJawaban);
    // cek apakah semua jawaban sudah bernilai
    let send = scores;
    let ok = false;
    send.forEach(e => (e > 0) ? ok = true : ok = false);
    if (ok == true) {
        setTimeout(() => {
            updateNilai(totalScore);
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

// untuk memeriksa ujian aktif 
async function cekAktif(token) {
    loadScreen();
    const target = 'tema';
    const apisoal = new ApiService();
    apisoal.setUrl(url + target).setMethod('GET').addHeader('x-apikey', myapi);

    console.log(apisoal)

    try {
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
            setJudulUjian(ujian.judul, ujian.deskripsi);
            loadScreen();
            getSoal();
            login(ujian.id, ujian.judul);
           }
           else {
             forbidden();
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
    referenceData = JSON.parse(JSON.stringify(referenceData));
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
        return (1 - results.score.toFixed(4));
    } catch (e) {
        alert('Mohon dijawab dengan benar');
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
    let submit = document.getElementById('submit');
    let input = document.getElementsByClassName('datadiri');

    submit.addEventListener('click', (e) => {
        for (let item of input) {
            datadiri[item.getAttribute('id')] = item.value;
        }

        loginForm.classList.replace('l-active', 'l-disabled');
        uploadNilai(1);
    })

}


// send data ke server
async function sendToServer(data) {
    loadScreen();

    var settings = {
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

    $.ajax(settings).done(function (response) {
        console.log(response);
        id_lembar_ujian = response.id_lembar_ujian;
        id_lembar_ujian_change = response._id;
        loadScreen();
    }).fail(function (e) {
        errMsg.textContent = "error: " + e;
    });
}

// send jawaban ke server
function kirimJawaban(jawaban) {
    //loadScreen()
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "/jawaban",
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": JSON.stringify(jawaban)
    }

    $.ajax(settings).done(function (response) {
        console.log(response);
        //loadScreen();
    }).fail(function (e) {
        errMsg.textContent = "error: " + e;
    });

}

function updateNilai(newTotal) {
    loadScreen()
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

    $.ajax(settings).done(function (response) {
        console.log(response);
        loadScreen();
    }).fail((e) => {
        errMsg.textContent = "error: " + e.toString();
    })
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

function forbidden(){
  window.location.href = "forbidden.html"
}

function getToken(){
  let tmp = window.location.href;
  tmp = tmp.split('?token=');
  if(tmp.length > 1){
  return tmp[1];
  }
  else {
    forbidden();
  }
}