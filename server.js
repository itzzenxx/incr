import { Level } from "level";
const db = new Level(".data/level", { valueEncoding: "json" });

import express from "express";
import bodyParser from "body-parser";
import __dirname from "./dirname.js";
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});
function htmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
async function get(key) {
  try {
    return await db.get("counter-" + key);
  } catch (e) {
    if (e.notFound) return 0;
    throw e;
  }
}
import AsyncLock from "async-lock";
const lock = new AsyncLock();
async function increment(key) {
  return await lock.acquire(key, async function () {
    const num = (await get(key)) + 1;
    await db.put("counter-" + key, num);
    return num;
  });
}
app.all("/badge", async (request, response) => {
  let key = request.query.key || request.body.key;
  const web2point0 = request.query.web === "2.0"
  const decreasing = request.query.dec === "rease"
  let bg = decreasing?"/bgd.gif":"/bg.gif";
  try {
    bg = (request.query.bg || request.body.bg) ? new URL(request.query.bg || request.body.bg, "http:base").href.replace(/^http:/,"") || bg : bg
  } catch(e) {}
  if (!key) {
  return response.status(400).send("no key");
  }
  let value;
  if (request.method == "POST") {
    if (new URL(request.headers.referer).hostname !== request.headers.host) {
      return response.status(400).send("can't incr without referer");
    }
    try {
      value = await increment(key);
    } catch (e) {
      console.error(e);
      return response.status(500).send("db error");
    }
  } else if (request.method == "GET") {
    try {
      value = await get(key);
    } catch (e) {
      console.error(e);
      return response.status(500).send("db error");
    }
  } else {
    return response.status(405).send("method not allowed");
  }
  if(decreasing) value = 0 - value
  if(web2point0) {
    response.header("Content-Type", "image/svg+xml");
    response.send(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="87" height="20" role="img" aria-label="${decreasing?"De":"In"}crement: ..."><title>${decreasing?"De":"In"}crement: ...</title><a target="_blank" xlink:href="https://github.com/itzzenxx/incr/"><style>a:hover #llink{fill:url(#b);stroke:#ccc}a:hover #rlink{fill:#4183c4}</style><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#fcfcfc" stop-opacity="0"/><stop offset="1" stop-opacity=".1"/></linearGradient><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#ccc" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><g stroke="#d5d5d5"><rect stroke="none" fill="#fcfcfc" x="0.5" y="0.5" width="63" height="19" rx="2"/><rect x="69.5" y="0.5" width="17" height="19" rx="2" fill="#fafafa"/><rect x="69" y="7.5" width="0.5" height="5" stroke="#fafafa"/><path d="M69.5 6.5 l-3 3v1 l3 3" stroke="d5d5d5" fill="#fafafa"/></g><g aria-hidden="true" fill="#333" text-anchor="middle" font-family="Helvetica Neue,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-weight="700" font-size="110px" line-height="12px"><rect id="llink" stroke="#d5d5d5" fill="url(#a)" x=".5" y=".5" width="63" height="19" rx="2"/><text aria-hidden="true" x="315" y="150" fill="#fff" transform="scale(.1)" textLength="530">${decreasing?"De":"In"}crement</text><text x="315" y="140" transform="scale(.1)" textLength="530">${decreasing?"De":"In"}crement</text><text aria-hidden="true" x="775" y="150" fill="#fff" transform="scale(.1)" textLength="90">...</text><text id="rlink" x="775" y="140" transform="scale(.1)" textLength="90">...</text></g></a><defs><foreignObject><script data-count="${value}" xmlns="http://www.w3.org/1999/xhtml" src="/web2.0.js" type="module"/></foreignObject></defs></svg>`)
  } else {
  response.header("Content-Type", "text/html");
  response.send(`<!DOCTYPE html><html style="margin:0;overflow:hidden;color-scheme:light dark"><head><title>increment badge</title><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><style><!--@media(-webkit-device-pixel-ratio:1),(-webkit-device-pixel-ratio:2),(-webkit-device-pixel-ratio:3),(-webkit-device-pixel-ratio:4),(-webkit-min-device-pixel-ratio:5){html{image-rendering:pixelated}}--></style></head><body style="margin:0"><font color="#000" size="0" face="monospace"><table role="presentation" width="88" height="31" cellspacing="0" cellpadding="0" style="image-rendering: pixelated;" background="${htmlEscape(bg)}"><tr aria-hidden="true" height="4"><td colspan="4"></td></tr><tr height="15" role="presentation"><td aria-hidden="true" width="6"></td><td role="presentation" width="61"><font size="1" style="font-size:12px" face="monospace"><span style="font-size:0;width:0;height:0;display:inline-block;overflow:hidden">this page has </span>${value}<span style="font-size:0;width:0;height:0;display:inline-block;overflow:hidden"> increments</span></font></td><td role="presentation" width="15"><form action="/badge?key=${htmlEscape(
    encodeURIComponent(key)
  )}${(!(bg === "/bg.gif" || bg === "/bgd.gif"))?"&bg="+htmlEscape(
    encodeURIComponent(bg)
  ):""}${decreasing?"&dec=rease":""}" method="POST" style="width:15px;height:15px;display:block;overflow:hidden;margin:0;filter:alpha(opacity=0);-moz-opacity:0;-khtml-opacity:0;opacity:0"><button type="submit" style="width:100%;height:100%;margin:0;padding:0;border:none;background:transparent;cursor:pointer;cursor:hand" title="${decreasing?"de":"in"}crement this page"><span style="font-size:0;width:0;height:0;display:inline-block;overflow:hidden">${decreasing?"de":"in"}crement this page</span></button></form></td><td aria-hidden="true" width="4"></td></tr><tr aria-hidden="true"><td colspan="4"></td></tr><tr role="presentation" height="7"><td colspan="4" role="presentation" style="text-align:center"><a href="/" target="_blank" style="margin:auto;text-decoration:none;width:50px;display:block;overflow:hidden;height:7px;filter:alpha(opacity=0);-moz-opacity:0;-khtml-opacity:0;opacity:0" title="powered by increment">powered by increment</a></td></tr><tr aria-hidden="true" height="2"><td colspan="4"></td></tr></table></font></body><script language="javascript"><!--
var e=document.forms[0].parentElement.parentElement.children[1],t=e.children[0].childNodes[1],n=parseInt(t.data);"undefined"==typeof XMLHttpRequest&&(XMLHttpRequest=function(){return new window.ActiveXObject(navigator.userAgent.indexOf("MSIE 5")>=0?"Microsoft.XMLHTTP":"Msxml2.XMLHTTP")});var o=!1;document.forms[0].onsubmit=function(r){"object"!=typeof r&&(r=event);var a=new XMLHttpRequest;return o?("function"==typeof r.preventDefault&&r.preventDefault(),r.returnValue=!1):(a.open("POST",document.forms[0].action,!0),a.onreadystatechange=function(t){4==a.readyState&&(o=!1,e.style.color="#000000")},a.send(""),o=!0,e.style.color="#808080",n${decreasing?"--":"++"},t.data=""+n,"function"==typeof r.preventDefault&&r.preventDefault(),r.returnValue=!1)};// --></script></html>`);
  }
});

const listener = app.listen(3002, '127.0.0.1', () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
