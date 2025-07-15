class ApiService {
  constructor() {
    this.url = '';       // URL endpoint API
    this.method = 'GET';  // Default method GET
    this.data = null;     // Data untuk body request (POST/PUT)
    this.myapi = '';      // API key jika diperlukan
    this.headers = {
      'Content-Type': 'application/json',
      // Header default lainnya bisa ditambahkan di sini
    };
  }

  // Method untuk set API key
  setApiKey(apiKey) {
    this.myapi = apiKey;
    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      delete this.headers['Authorization'];
    }
    return this; // Return this untuk chaining
  }

  // Method untuk set URL
  setUrl(url) {
    this.url = url;
    return this;
  }

  // Method untuk set method (GET, POST, PUT, DELETE, etc)
  setMethod(method) {
    this.method = method.toUpperCase();
    return this;
  }

  // Method untuk set data
  setData(data) {
    this.data = data;
    return this;
  }

  // Method untuk menambahkan custom header
  addHeader(key, value) {
    this.headers[key] = value;
    return this;
  }

  // Method utama untuk eksekusi request
  async execute() {
    if (!this.url) {
      throw new Error('URL endpoint belum di-set');
    }

    const options = {
      method: this.method,
      headers: this.headers,
    };

    // Tambahkan body untuk method selain GET/HEAD
    if (this.data && ['POST', 'PUT', 'PATCH'].includes(this.method)) {
      options.body = JSON.stringify(this.data);
    }

    try {
      const response = await fetch(this.url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }
}

// Contoh penggunaan:
// const api = new ApiService()
//   .setUrl('https://contoh.com/api/data')
//   .setMethod('POST')
//   .setData({ name: 'John Doe' })
//   .setApiKey('apikey-rahasia');
//
// try {
//   const result = await api.execute();
//   console.log(result);
// } catch (error) {
//   console.error('Gagal:', error);
// }

//export default ApiService;