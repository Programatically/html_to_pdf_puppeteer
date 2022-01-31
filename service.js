const puppeteer = require("puppeteer");
const fetch = require('node-fetch');
const fs = require("fs");


exports.hello_world = async (req, res) => res.send('Hello World');

exports.generate_pdf = async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const html = await `${fs.readFileSync(`./dummy.html`, "utf8")}`;
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: false,
    preferCSSPageSize: true,
    displayHeaderFooter: true,

    headerTemplate: `<div class="header" style="font-size:20px; padding-left:15px;"><h1>Main Heading</h1></div> `,
    footerTemplate: '<footer><h5>Page <span class="pageNumber"></span> of <span class="totalPages"></span></h5></footer>',
    margin: { top: "200px", bottom: "150px", right: "20px", left: "20px"},
  });

  //  SENDING BACK PDF IN RESPONCE TO API CALL
  res.contentType("application/pdf");
  res.send(pdf);  
};



exports.generate_pdf_with_css = async (req, res) => { 
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const logo_url = "https://programatically.com/file/2021/10/Nginx-Docker-BG.webp";

  // FETCHING LOGO FROM URL AND CONVERTING INTO BASE64
  var logo = await fetch(logo_url)
    .then((response) => response.buffer())
    .then((buffer) => buffer.toString("base64"))
    .catch(console.error);

  //  ADDING CSS TO HTML BODY CONTENT
  const html = await `<style> ${fs.readFileSync(`./bootstrap.css`, "utf8")} </style> ${fs.readFileSync(`./dummy.html`, "utf8")}`; 
  await page.setContent(html, { waitUntil: "domcontentloaded"});

  //  ADDING HEADER FOOTER CSS
  // var cssb = [];
  // cssb.push(
  //   `<style> ${fs.readFileSync("./header_footer.css", "utf8", (err, data) =>
  //     data.toString()
  //   )} </style>`
  // );
  // const css = cssb.join("");

  const pdf = await page.pdf({
    format: "A4",
    printBackground: false,
    preferCSSPageSize: true,
    displayHeaderFooter: true,

    headerTemplate: `<div class="header"><img width="100" src="data:image/png;base64, ${logo}" alt="company_logo"> <h1>Main Heading</h1></div> `,
    footerTemplate: '<footer><h5>Page <span class="pageNumber"></span> of <span class="totalPages"></span></h5></footer>',
    margin: { top: "200px", bottom: "150px", right: "20px", left: "20px" },
  });

  //  SENDING BACK PDF IN RESPONCE TO API CALL
  res.contentType("application/pdf");
  res.send(pdf);  
};




exports.generate_dynamic_pdf = async (req, res) => {
  try {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) { res.send("No Request Body Found!"); return }

    const data = req.body;

    let html;
    var logo_bin = '';
    var heading = 'Main Heading';
    var header_content = '';
    var footer_content = '';
    var margins = ["200px", "150px", "20px", "20px"];


    // Extracting Raw HTML From request-body
    if (!data.hasOwnProperty("html") || data.html == "") {
      res.send("No HTML Found!");
      return;
    } else {
      html = data.html;
    }

    if (data.hasOwnProperty('logoBin') && data.logoBin.length > 0) { logo_bin = data.logoBin; } 
    if (data.hasOwnProperty('mainHeading') && data.mainHeading.length > 0) { heading = data.mainHeading; } 
    if (data.hasOwnProperty('headerFooterCss') && data.headerFooterCss.length > 0) { fs.writeFile( "./header_footer.css", data.headerFooterCss, ()=>null ) }
    if (data.hasOwnProperty('headerContent') && data.headerContent.length > 0) { header_content = util.format(data.headerContent, logo_bin, heading); } 
    if (data.hasOwnProperty('footerContent') && data.footerContent.length > 0) { footer_content = data.footerContent; }
    if (data.hasOwnProperty('pdfMargins') && data.pdfMargins.length > 0) { margins = data.pdfMargins.split(';'); }

    const browser = await puppeteer
      .launch({ headless: true, args: ["--no-sandbox"] })
      .catch(console.error);
    const page = await browser.newPage().catch(console.error);

    //  ADDING CSS TO HTML BODY CONTENT
    html = `<style> ${fs.readFileSync("./html_body.css", "utf8")} </style>
  ${data.html.replace(/{{'/g, "").replace(/'}}/g, "")}`;

    await page
      .setContent(html, {
        waitUntil: "domcontentloaded",
      }).catch(console.error);

    //  ADDING HEADER AND FOOTER CSS
    var cssb = [];
    cssb.push(
      `<style> ${fs.readFileSync("./header_footer.css", "utf8", (err, data) =>
        data.toString()
      )} </style>`
    );
    const header_footer_css = cssb.join("");

    const pdf = await page
      .pdf({
        format: "A4",
        printBackground: false,
        preferCSSPageSize: true,
        displayHeaderFooter: true,

        headerTemplate: header_footer_css + header_content,
        footerTemplate: footer_content,
        margin: {
          top: margins[0],
          bottom: margins[1],
          right: margins[2],
          left: margins[3],
        },
      })
      .catch(console.error);

    //  SENDING BACK PDF IN RESPONCE TO API CALL
    res.contentType("application/pdf");
    await browser.close()
    // res.header("Access-Control-Allow-Origin", "*");
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    // res.header('Access-Control-Allow-Origin: your origin');
    // res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    // res.header('Access-Control-Allow-Credentials: true');
    // res.header('Access-Control-Max-Age:86400');
    // res.header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token,  Accept, Authorization, X-Requested-With');
    res.send(pdf);
  } catch (err) {
    console.log(err.toString());
    res.send({"error": err.toString()});
  }
};