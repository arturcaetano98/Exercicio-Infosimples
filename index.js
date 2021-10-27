// Bibliotecas que nós instalamos manualmente
const cheerio = require('cheerio');
const request = require('request');

// Bibliotecas nativas do Node.jsnpm
const fs = require('fs');
const { Console } = require('console');
const { Parser } = require('htmlparser2');
const { each } = require('cheerio/lib/api/traversing');
const { find } = require('domutils');

// URL do site
const url = 'https://storage.googleapis.com/infosimples-public/commercia/case/product.html';

// Objeto contendo a resposta final
const respostaFinal = {};

// Faz o request e manipula o corpo de resposta
request(url, function (error, response, body) {
const parsedHtml = cheerio.load(body);

// Vamos pegar o título do produto, na tag H2, com ID "product_title"
respostaFinal['title'] = parsedHtml('h2#product_title').text();

// Aqui você adiciona os outros campos...
respostaFinal['brand'] = parsedHtml('.brand').text();

const categorias = [];
parsedHtml('.current-category > a').each(function(index, elemento){
    categorias.push(parsedHtml(elemento).text());
});

respostaFinal['categories'] = categorias;

respostaFinal['description'] = parsedHtml('.product-details > p').text();

const skus = [];
parsedHtml('.skus-area > div > div').each(function(index, elemento){
    const sku = {};
    sku.name = parsedHtml(elemento).find('meta[itemprop="name"]').attr('content');
    if(parsedHtml(elemento).find('.sku-current-price').text().length != 0){
        sku.current_price = parseFloat(parsedHtml(elemento).find('.sku-current-price').text().replace(/[^0-9.]/g, ''));
        sku.old_price = (parsedHtml(elemento).find('.sku-old-price').text().length != 0 ? parseFloat(parsedHtml(elemento).find('.sku-old-price').text().replace(/[^0-9.]/g, '')): null);
        sku.available = true
    }
    else{
        sku.current_price = null;
        sku.old_price = null;
        sku.available = false;
    }
    skus.push(sku);
});

respostaFinal['skus'] = skus;
const propriedades = [];
var i = 0;

const linha = {"label" : null, "value" : null};
parsedHtml('.pure-table > tbody').each(function(index, elemento){
    parsedHtml(elemento).each(function(index1, elemento1){
        parsedHtml(elemento1).find('td').each(function(index2, elemento2){
            if(i == 0){ 
                descricao = parsedHtml(elemento2).text().replace(/\\n /g,"");
                i++;
            }
            else{
                valor = parsedHtml(elemento2).text().replace(/\\n /g,"");      
                propriedades.push({"label": descricao, "value" : valor});
                i = 0;
           }
        });
    });
});

respostaFinal['properties'] = propriedades;

var usuario, data, nota, comentario, review = [];

parsedHtml('.review-box').each(function(index, elemento){
    parsedHtml(elemento).find('.pure-u-21-24').each(function(index1, elemento1){
        usuario = parsedHtml(elemento1).find('.review-username').text().replace(/\\n /g,"");
        data = parsedHtml(elemento1).find('.review-date').text().replace(/\\n /g,"");
        nota = parsedHtml(elemento1).find('.review-stars').text().replace(/☆/g,"").length;
    });
    comentario = parsedHtml(elemento).find('p').text();
    review.push({name: usuario, date: data, score: nota, text: comentario});
});

respostaFinal['reviews'] = review;

respostaFinal['reviews_average_score'] = parsedHtml('#comments').find('h4').text().replace(/\/5|[^.0-9]/g,"");

respostaFinal['url'] = url;


// Gera string JSON com a resposta final
const jsonRespostaFinal = JSON.stringify(respostaFinal);

// Salva o arquivo JSON com a resposta final
fs.writeFile('produto.json', jsonRespostaFinal, function (err) {
if (err) {
// Loga o erro (caso ocorra)
console.log(err);
} else {
console.log('Arquivo salvo com sucesso!');
}
});
});