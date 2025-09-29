alert('Server 2 dalam uji coba, SS jika terjadi error, terima kasih');
// untuk info ujian
let ujian;
// untuk menampung pertanyaan
let questionsData = [];

// untuk menampung nilai
let scores = [];

let datadiri = {};

let id_lembar_ujian = 0;
let id_lembar_ujian_change = 0;

// loading model NLP 
function loadModel(){
  let wrap = document.createElement('div');
  wrap.setAttribute('style','position:fixed; width:100vw; height: auto; padding: 3% 5%; white-space: normal; z-index: 200; display: block; text-align: center; left: 0; top: 0; color: #222; background: rgba(255,255,255,.8); border-radius: 8px');
  wrap.setAttribute('id','statusNLP');
  wrap.textContent = "Memuat model NLP...mohon tunggu";
  
  document.body.appendChild(wrap);
}
loadModel()

// untuk NLP baru USE
let modelUSE;
(async () => {
    //document.getElementById("hasil").textContent = "Loading model semantic...";
    let status = document.getElementById('statusNLP')
    try {
    modelUSE = await use.load();
    if(status == null){
      
    }
    else
    {
      status.textContent = "Model NLP siap.";
      setTimeout(()=>{
        document.body.removeChild(status);
      },1500)
    }
    }
    catch(err){
      status.textContent = "Model NLP gagal dimuat, silakan refresh/ muat ulang halaman.";
    }
    //document.getElementById("hasil").textContent = "Model siap, silakan uji!";
})();


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
async function evaluateAnswer(questionNum) {
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
        //tombolEvaluasi.textContent = "coba lagi ?";
        tombolEvaluasi.setAttribute('class', 'disabled');
    }

    loadingElement.style.display = "block";
    resultElement.style.display = "none";

    //setTimeout(() => {
        loadingElement.style.display = "none";
        
        // kode di bawah menggunakan fuse.js 
        
        let nilaiNLP = [];
        //let tmpNLP = getNilaiNLP(question.keyword, answer);
        //console.log("dari keyword : " + tmpNLP);
        try {
        nilaiNLP = await getNilaiNLP(question.ideal, answer); // dengan USE nilainya array //harusnya question.ideal
        //console.log("dari ideal : " + nilaiNLP);
        
           //console.log("jwb : " + answer.length)
            //console.log("ideal : " + questionLength)
            // diganti karena USE
            //const keywordScore = (keywordCount / question.keyword.length) * 30; //tadinya 50
            //const lengthScore = Math.min((answer.length / questionLength) * 40, 40); // tadinya 30
            
            //const lengthScore = Math.min((answer.length / question.keyword.join(' ').length) * 40, 40); // tadinya 30
            const lengthScore = Math.min((answer.length / question.keyword.length) * 40, 40); // tadinya 30
            
            console.log(nilaiNLP);
            console.log(typeof nilaiNLP);
            for(let i in nilaiNLP){
                console.log(typeof nilaiNLP[i] + " : " + nilaiNLP[i]);
            }

            const keywordScore = nilaiNLP['semantic']/100 * 30
            const answerMatch = nilaiNLP['similarity']/100 * 30
            
            //const answerMatch = (nilaiNLP) * 30; //tadinya 20 Math.random() * 20; //ini untuk NLP ideal answer: (key) : ideal 

        
        //jsonCheck(question.ideal);

        const score = Math.min(Math.round(keywordScore + lengthScore + answerMatch), 100);
        //console.log(score)
        //console.log(keywordScore)
        //console.log(typeof keywordScore)
        //console.log(lengthScore)
        //console.log(typeof lengthScore)
        //console.log(answerMatch)
        //console.log(typeof answerMatch)
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
            <p><strong>Nilai panjang jawaban</strong> ${(lengthScore / 40) * 100}%</p>
            <p><strong>Kata kunci yang ditemukan:</strong> ${(keywordScore / 30) * 100}%</p>
            <p><strong>Kesesuaian jawaban (NLP):</strong> ${(answerMatch / 30) * 100}%</p>
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
    
        
        // ini untuk mencari nilai terbaik
        // if(tmpNLP > nilaiNLP){
        //     nilaiNLP = tmpNLP;
        // }

        // pencarian kata kunci bisa dihindari
        // if (!Array.isArray(question.keyword)) {
        //     question.keyword = question.keyword.split(',');

        // }
        // let keywordCount = 0;
        // question.keyword.forEach(keyword => {
        //     if (answer.toString().toLowerCase().includes(keyword.toLowerCase().trim())) {
        //         keywordCount++;
        //         //console.log(keyword);
        //     }
        // });
        } catch(e){
          answerElement.focus();
          tombolEvaluasi.removeAttribute('disabled');
          tombolEvaluasi.removeAttribute('class');
          tombolEvaluasi.textContent = "coba lagi";
        }
        /*
        if(typeof nilaiNLP['similarity'] == "undefined"){
            // do not do anything
            
        }
        else {
        }*/
//}, 1500);
}

//let test;
const akhiriUjian = document.getElementById('akhiriUjian');
akhiriUjian.addEventListener('click',(e)=>{

    if(confirm('Akhiri ujian sekarang ?')){
      let delay = Math.floor(Math.random()*3000)
      //setTimeout(() => {
        updateNilai(scores);
        console.log("update Nilai")
        //finish();
     //}, delay);
    } else { 
      // do nothing
    }
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
    // ini untuk kirim nilai otomatis
    /*
    let send = scores;
    let ok = send.every((e)=> e > 0); // ini akan memeriksa nilai setiap item scores, jika ada satu saja nilai 0, nilainya false
    if (ok === true) {
        setTimeout(() => {
            updateNilai(scores);
        }, 1000);
    }
    */
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
const retry = document.getElementById('retry');

// delay helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let tokenBackup = false;
// untuk memeriksa ujian aktif 
async function cekAktif(token) {
  
    loadScreen();
    if(tokenBackup == true){
      token = getToken();
    }
    let tmpFilter = getFilter({"token": token});
    console.log(tmpFilter)
    const target = 'tema' + tmpFilter;
    const apisoal = new ApiService();
    apisoal.setUrl(url + target).setMethod('GET').addHeader('x-apikey', myapi);

    console.log(apisoal)

    try {
      tokenBackup = false;
         // delay acak 0–3000ms supaya tidak semua client barengan
        const delay = Math.floor(Math.random() * 3000);
        await sleep(delay);
        
        const result = await apisoal.execute();
        
        //console.log(result);
        //console.log("result zero : " + JSON.stringify(result[0]));
        if (result.length <= 0) {
            errMsg.textContent = "Ujian tidak ditemukan";
            
            setTimeout(() => {
            forbidden("Ujian tidak ditemukan");
                //writeQuestion();
            }, 1500);
            
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
    errMsg.textContent = "error: tidak dapat membuka ujian, coba ulang ";
    //console.log("cek : " +tokenBackup)
    localStorage.setItem('token', tokenBackup);
    //alert('Membuka ulang ujian.');
    
        
        let re = localStorage.getItem('token');
        tokenBackup = true;
        retry.textContent = "Coba ulang";
        retry.onclick = () => {
          loadScreen()
          retryReset()
          console.log('re :' + re)
          cekAktif(re);
        }
  
}
}

// untuk mendapatkan soal

async function getSoal() {
    loadScreen();
    let tmpFilter = getFilter({"id_tema":ujian.id})
    const target = 'soal' + tmpFilter;
    const apisoal = new ApiService();
    apisoal.setUrl(url + target).setMethod('GET').addHeader('x-apikey', myapi);

    console.log("memuat soal")

    try {
        const result = await apisoal.execute();
        console.log(result);
        let tmp = result.filter(item => item.id_tema == ujian.id);
        questionsData = tmp;
        loadScreen();
    } catch (error) {
        console.error('Gagal:', error);
        errMsg.textContent = "Error : tidak dapat mengambil soal, " + error;
        //alert("mencoba mengambil soal ulang");
        
        //setTimeout(()=>{
        retry.textContent = "Coba lagi"
        retry.onclick = () => {
            retryReset()
            loadScreen();
            getSoal();
        }
        //}, 2000)
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
    if (load_screen.classList.contains('ns-active-ls')) {
        load_screen.classList.replace('ns-active-ls', 'ns-gone-ls');
    }
    else {
        load_screen.classList.replace('ns-gone-ls', 'ns-active-ls');
    }
}

//nlp ini akan memeriksa kesesuaian jawaban dengan jawaban ideal

async function getNilaiNLP(referenceData, value) {
    //referenceData = JSON.parse(JSON.stringify(referenceData));
    referenceData = cleanTextFromWord(referenceData);
    value = cleanTextFromWord(value)

      // --- 1. String Similarity ---
      const skorString = stringSimilarity.compareTwoStrings(referenceData, value);

      // --- 2. Semantic Similarity (USE) ---
      const embeddings = await modelUSE.embed([referenceData, value]);
      const vektor1 = embeddings.arraySync()[0];
      const vektor2 = embeddings.arraySync()[1];

      let dot=0, norm1=0, norm2=0;
      for (let i=0; i<vektor1.length; i++) {
        dot += vektor1[i]*vektor2[i];
        norm1 += vektor1[i]**2;
        norm2 += vektor2[i]**2;
      }
      const skorSemantik = dot / (Math.sqrt(norm1) * Math.sqrt(norm2));

      // output
      let output = {
        "similarity" : Math.round(parseFloat(skorString)*10000)/100,
        "semantic" : Math.round(parseFloat(skorSemantik)*10000)/100
      }
      console.log(output);

      return output;

    
    // ini adalah fuse.js
    /*
    const options = {
        keys: ['text'],
        includeScore: true,
        includeMatches: true,
        threshold: 0.8,
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
    */
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
let ulangData = false
async function sendToServer(data) {
    loadScreen();
    if(ulangData == true){
      data = localStorage.getItem('dataAwal');
      console.log("data ulang : "+data)
      data = JSON.parse(data)
      console.dir(data)
    }
    let settings = {
        "async": true,
        "crossDomain": true,
        "timeout": 120000,
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
       ulangData = false
        console.log(response);
        id_lembar_ujian = response.id_lembar_ujian;
        id_lembar_ujian_change = response._id;
        loadScreen();
    }).fail(function (e) {
        errMsg.textContent = "error: tidak dapat mengirim data diri, " + e.status;
        localStorage.setItem('dataAwal', JSON.stringify(data));
        //alert("Mencoba mengirim ulang data");
          let re = localStorage.getItem('dataAwal');
          //backupDataDiri = re;
          ulangData = true
          //re = JSON.parse(re);
          console.log(re)
          console.log(typeof re)
          retry.textContent = "Kirim ulang data diri";
          retry.onclick = () => {
            retryReset();
            loadScreen()
            sendToServer(re);
          }
        
    });
    }, delay);
}

// send jawaban ke server
let ulangJawab = false
function kirimJawaban(jawaban) {
    loadScreen()
    errMsg.textContent = "Mengirim jawaban ke server"
    if(ulangJawab == true){
      let jawaban = localStorage.getItem('jawaban');
      jawaban = JSON.parse(jawaban)
      console.dir(jawaban)
    }
    let settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "jawaban",
        "method": "POST",
        "timeout" : 120000,
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
        ulangJawab = false
        loadScreen();
    }).fail(function (e) {
      //loadScreen()
        errMsg.textContent = "error: tidak dapat mengirim jawaban, " + "coba kirim ulang.";
     //   console.log(typeof jawaban)
      //  console.log(jawaban)
        localStorage.setItem('jawaban', JSON.stringify(jawaban));
        //alert('Mencoba mengirim jawaban ulang');
        
        ulangJawab = true
        let re = localStorage.getItem('jawaban');
        console.log(re)
        re = JSON.parse(re);
        console.dir(re)
        retry.textContent = "Kirim ulang jawaban"
        retry.onclick = () => {
          retryReset();
          loadScreen();
          kirimJawaban(re);
        }
        
    });
    }, delay);

}

function updateNilai(newTotal) {
    loadScreen()
    errMsg.textContent = "Melakukan update nilai total siswa";
    console.log('update dimulai');
    newTotal = newTotal.reduce((a, b) => a + b, 0) / scores.length;
    let tmpKirim = {
        "total_score": newTotal,
    }
    let settings = {
        "async": true,
        "crossDomain": true,
        "url": url + "lembarujian/" + id_lembar_ujian_change,
        "method": "PUT",
        "timeout": 120000,
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
        finish();
    }).fail((e) => {
        errMsg.textContent = "error: tidak dapat update total nilai, coba kirim ulang";
        localStorage.setItem('newTotal',JSON.stringify(newTotal));
        //alert('Update nilai akan diulangi');
        let re = localStorage.getItem('newTotal');
        re = JSON.parse(re);
        retry.textContent = "Kirim ulang update nilai"
        retry.onclick = () => {
          retryReset();
          loadScreen()
        updateNilai(scores);
        }
        
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
  tmp = tmp.split('token=');
  let tmpSvr = tmp[0].split('&')[0]; // untuk membuang '&'
  tmpSvr = tmpSvr.split('?server=')[1]; // harusnya jawaban angka (untuk memilih server);
  url = listUrl[tmpSvr];
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
    // Ms. Word sering menggunakan karakter "smart uotes" (‘ ’ “ ”) dan em-dashes (—)
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
        banner.src = url + "uploads/" + base64;
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
        "timeout": 120000,
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
            //alert("Anda telah mengerjakan ujian ini, tidak dapat mengerjakan ujian ulang");
            if(confirm("Anda telah mengerjakan ujian ini, mengerjakan ujian ulang akan menghapus data sebelumnya, lanjutkan ?")){
              loadScreen();
              setTimeout(()=>{
                deleteJawaban(response[0].id_lembar_ujian);
              }, 7000);
              uploadNilai(1);
            }
            else {
            forbidden("Tidak diperbolehkan mengerjakan ujian dua kali, kecuali ada masalah teknis.");
            }
            //forbidden("Tidak diperbolehkan mengerjakan ujian dua kali.");
        }
        else {
            loadScreen();
            uploadNilai(1);
        }
        
    }).fail(function (e) {
        errMsg.textContent = "error: tidak dapat terhubung ke server"// + JSON.stringify(e);
        localStorage.setItem('ujianId',ujian.id)
        localStorage.setItem('datadiriNama', datadiri.nama);
        localStorage.setItem('datadiriEmail', datadiri.email);
       // alert("Pengecekan akan dilakukan ulang");
        
            
            let re = localStorage.getItem('ujianId');
            let re1 = localStorage.getItem('datadiriNama');
            let re2 = localStorage.getItem('datadiriEmail');
            
            retry.textContent = "Verifikasi ulang";
            retry.onclick = () => {
            retryReset()
              loadScreen()
            cekNamaEmail(re, re1, re2);
            }
      
    });
    }, delay);
}


// fungsi tambahan untuk mengurangi beban server
function getFilter(obj = {}){
    let search = obj;
    // search["id_tema"] = ujian.id

    // if(email == ""){
    //     search["nama"] = nama;
    // }
    // else {
    //     search["email"] = email;
    // }

    search = JSON.stringify(search).replace(/\\"/g,'');
    let tmp = search;
    if(slimFr == true){
        search = "/?q=" + tmp;
    }
    else {
        search = "?q=" + tmp;
    }
    return search; // string
}


function deleteJawaban(id_lembar_ujian){
    loadScreen()
    errMsg.textContent = "Data lama sedang dihapus";
    let delsettings = {
        "async": true,
        "crossDomain": true,
        "url": url + "lembarujian/" + id_lembar_ujian,
        "method": "DELETE",
        "timeout": 120000,
        "headers": {
            "content-type": "application/json",
            "x-apikey": myapi,
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": null
    }

    // delay acak 0–3000ms supaya tidak semua client barengan
    const delay = Math.floor(Math.random() * 3000);
    //await sleep(delay);

    setTimeout(()=>{
    $.ajax(delsettings).done(function (response) {
        console.log(response);
        loadScreen();
    }).fail((e) => {
        errMsg.textContent = "error: tidak dapat menghapus data lama, mencoba menghapus ulang";
        localStorage.setItem('idLembar', id_lembar_ujian);
        
        
      
        let re = localStorage.getItem('idLembar');
        re = JSON.parse(re);
        retry.textContent = "Coba ulang"
        retry.onclick = () =>{
          retryReset()
          loadScreen()
          deleteJawaban(re);
        }
        
    })
    }, delay);   
}

function retryReset(){
  if(retry.textContent != "memuat"){
    errMsg.textContent = "Memproses data"
    retry.textContent = "memuat"
    retry.onclick = null;
  }
}
