const express = require('express');
const app = express();
const service = require('./services')
const cors = require('cors')

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cors());


app.get("/test", service.hello_world);
app.post("/pdf", service.generate_pdf);
app.post("/pdf-with-css", service.generate_pdf_with_css);


app.listen(3000, ()=> {
    console.log(`project running on port 3000`);
});