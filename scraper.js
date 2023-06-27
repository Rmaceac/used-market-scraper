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

  craigslistListings.each((index, element) => {
    if (index >= limit) return; // Limit the number of results
    const title = craigslist$(element).find('.result-title.hdrlnk').text().trim();
    const price = craigslist$(element).find('.result-price').text().trim();
    results.push({ title, price, website: 'Craigslist' });
  });

  // Kijiji.ca
  const kijijiUrl = `https://www.kijiji.ca/b-${city}/${encodedItem}/k0l1700203`;
  const kijijiResponse = await axios.get(kijijiUrl);
  const kijijiHtml = kijijiResponse.data;
  const kijiji$ = cheerio.load(kijijiHtml);
  const kijijiListings = kijiji$('.regular-ad');

  kijijiListings.each((index, element) => {
    if (index >= limit) return; // Limit the number of results
    const title = kijiji$(element).find('.title').text().trim();
    const price = kijiji$(element).find('.price').text().trim();
    results.push({ title, price, website: 'Kijiji' });
  });

  // Used.ca
  const usedUrl = `https://www.used${city}.com/classifieds/all/${encodedItem}`;
  const usedResponse = await axios.get(usedUrl);
  const usedHtml = usedResponse.data;
  const used$ = cheerio.load(usedHtml);
  const usedListings = used$('.listing');

  usedListings.each((index, element) => {
    if (index >= limit) return; // Limit the number of results
    const title = used$(element).find('.listing-title').text().trim();
    const price = used$(element).find('.price').text().trim();
    results.push({ title, price, website: 'Used.ca' });
  });

  return results;
}

// Get command line arguments
const city = process.argv[2]; // Specify the city to search
const limit = parseInt(process.argv[3]); // Number of postings to return from each site
const item = process.argv.slice(4).join(' '); // Item you are looking for (multi-word support)

if (!city || !limit || !item) {
  console.log('Please provide all three parameters: city, limit, and item.');
  console.log('Example: node scraper.js vancouver 5 water bottle');
} else {
  searchWebsites(city, limit, item)
    .then((results) => {
      // Print the consolidated results
      results.forEach((result) => {
        console.log(`Website: ${result.website}`);
        console.log(`Title: ${result.title}`);
        console.log(`Price: ${result.price}`);
        console.log('---');
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
