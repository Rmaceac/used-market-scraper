const axios = require('axios');
const cheerio = require('cheerio');

async function searchWebsites(city, limit, item) {
  const results = [];

  // Replace spaces in the item with '+' for URL encoding
  const encodedItem = item.replace(/\s/g, '+');

  // Craigslist.org
  const craigslistUrl = `https://${city}.craigslist.org/search/sss?query=${encodedItem}&sort=date`;
  const craigslistResponse = await axios.get(craigslistUrl);
  const craigslistHtml = craigslistResponse.data;
  const craigslist$ = cheerio.load(craigslistHtml);
  const craigslistListings = craigslist$('.result-row');

  let craigslistCount = 0; // Counter for Craigslist results
  craigslistListings.each((index, element) => {
    if (craigslistCount >= limit) return; // Limit the number of results per website
    const title = craigslist$(element).find('.result-title.hdrlnk').text().trim();
    const price = craigslist$(element).find('.result-price').text().trim();
    const link = craigslist$(element).find('.result-title.hdrlnk').attr('href');
    results.push({ title, price, link, website: 'Craigslist' });
    craigslistCount++;
  });

  // Kijiji.ca
  const kijijiUrl = `https://www.kijiji.ca/b-${city}/${encodedItem}/k0l1700203`;
  const kijijiResponse = await axios.get(kijijiUrl);
  const kijijiHtml = kijijiResponse.data;
  const kijiji$ = cheerio.load(kijijiHtml);
  const kijijiListings = kijiji$('.regular-ad');

  let kijijiCount = 0; // Counter for Kijiji results
  kijijiListings.each((index, element) => {
    if (kijijiCount >= limit) return; // Limit the number of results per website
    const title = kijiji$(element).find('.title').text().trim();
    const price = kijiji$(element).find('.price').text().trim();
    const link = 'https://www.kijiji.ca' + kijiji$(element).find('.title').attr('href');
    results.push({ title, price, link, website: 'Kijiji' });
    kijijiCount++;
  });

  // Used.ca
  const usedUrl = `https://www.used${city}.com/classifieds/all/${encodedItem}`;
  const usedResponse = await axios.get(usedUrl);
  const usedHtml = usedResponse.data;
  const used$ = cheerio.load(usedHtml);
  const usedListings = used$('.listing');

  let usedCount = 0; // Counter for Used.ca results
  usedListings.each((index, element) => {
    if (usedCount >= limit) return; // Limit the number of results per website
    const title = used$(element).find('.listing-title').text().trim();
    const price = used$(element).find('.price').text().trim();
    const link = 'https://www.used' + city + '.com' + used$(element).find('.listing-title').attr('href');
    results.push({ title, price, link, website: 'Used.ca' });
    usedCount++;
  });

  return results;
}

// Get command line arguments
const city = process.argv[2]; // Specify the city to search
const limit = parseInt(process.argv[3]); // Number of postings to return from each site
const item = process.argv.slice(4).join(' '); // Item you are looking for (multi-word support)

if (!city || !limit || !item) {
  console.log('Please provide all three parameters: city, limit, and item.');
  console.log('Example: node scraper.js vancouver 3 water bottle');
} else {
  searchWebsites(city, limit, item)
    .then((results) => {
      // Print the consolidated results
      results.forEach((result) => {
        console.log(`Website: ${result.website}`);
        console.log(`Title: ${result.title}`);
        console.log(`Price: ${result.price}`);
        console.log(`Link: ${result.link}`);
        console.log('---');
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
