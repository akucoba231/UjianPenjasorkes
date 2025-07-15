// Opsi 1: Mencegah klik kanan di seluruh halaman (pada elemen <body>)

document.body.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Mencegah munculnya menu konteks
    // Opsional: Anda bisa menambahkan alert atau log ke konsol
    // alert('Klik kanan dinonaktifkan di halaman ini!');
});
