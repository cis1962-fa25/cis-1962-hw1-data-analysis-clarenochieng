/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */

const fs = require('fs');
const Papa = require('papaparse');

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    const csv = Papa.parse(data, { header: true, skipEmptyLines: true });
    return csv;
}


/**	Testing
 * 	const res = parseData(path.join(__dirname, "multilingual_mobile_app_reviews_2025.csv"));
 * 	console.log(res.data);
 */

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    function isNA(value) {
        return (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')
        );
    }

    const rows = csv && csv.data ? csv.data : [];
    if (rows.length === 0) return [];

    const requiredCols = [
        'review_id',
        'user_id',
        'app_name',
        'app_category',
        'review_text',
        'review_language',
        'rating',
        'review_date',
        'verified_purchase',
        'device_type',
        'num_helpful_votes',
        'user_age',
        'user_country',
        'app_version',
    ];

    const cleaned = [];

    for (const row of rows) {
        let skip = false;
        for (const col of requiredCols) {
            if (isNA(row[col])) {
                skip = true;
                break;
            }
        }
        if (skip) continue;

        const reviewId = parseInt(row.review_id, 10);
        const userId = parseInt(row.user_id, 10);
        const rating = parseFloat(row.rating);
        const reviewDate = new Date(row.review_date);
        const numHelpfulVotes = parseInt(row.num_helpful_votes, 10);
        const userAge = parseInt(row.user_age, 10);

        if (
            Number.isNaN(reviewId) ||
            Number.isNaN(userId) ||
            Number.isNaN(numHelpfulVotes) ||
            Number.isNaN(userAge) ||
            Number.isNaN(rating) ||
            isNaN(reviewDate.getTime())
        ) {
            continue;
        }

        const user = {
            user_id: userId,
            user_age: userAge,
            user_country: row.user_country,
            user_gender: isNA(row.user_gender) ? null : row.user_gender,
        };

        const cleanedRow = { ...row };
        cleanedRow.review_id = reviewId;
        cleanedRow.rating = rating;
        cleanedRow.review_date = reviewDate;
        cleanedRow.num_helpful_votes = numHelpfulVotes;
        cleanedRow.verified_purchase =
            row.verified_purchase === 'true' || row.verified_purchase === true;
        cleanedRow.user = user;

        delete cleanedRow.user_id;
        delete cleanedRow.user_country;
        delete cleanedRow.user_gender;
        delete cleanedRow.user_age;

        cleaned.push(cleanedRow);
    }

    return cleaned;
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (typeof rating !== 'number') return 'neutral';
    if (rating > 4) return 'positive';
    if (rating < 2) return 'negative';
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const map = new Map();
    for (const row of cleaned) {
        const sentiment = labelSentiment(row);
        row.sentiment = sentiment;
        const app = row.app_name;
        if (!map.has(app)) {
            map.set(app, {
                app_name: app,
                positive: 0,
                neutral: 0,
                negative: 0,
            });
        }
        const bucket = map.get(app);
        if (sentiment === 'positive') bucket.positive++;
        else if (sentiment === 'negative') bucket.negative++;
        else bucket.neutral++;
    }
    return Array.from(map.values());
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{lang_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const map = new Map();
    for (const row of cleaned) {
        const sentiment = labelSentiment(row);
        row.sentiment = sentiment;
        const lang = row.review_language;
        if (!map.has(lang)) {
            map.set(lang, {
                lang_name: lang,
                positive: 0,
                neutral: 0,
                negative: 0,
            });
        }
        const bucket = map.get(lang);
        if (sentiment === 'positive') bucket.positive++;
        else if (sentiment === 'negative') bucket.negative++;
        else bucket.neutral++;
    }
    return Array.from(map.values());
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const appCounts = new Map();
    for (const row of cleaned) {
        const app = row.app_name;
        appCounts.set(app, (appCounts.get(app) || 0) + 1);
    }

    let mostReviewedApp = null;
    let mostReviews = 0;
    for (const [app, count] of appCounts.entries()) {
        if (count > mostReviews) {
            mostReviews = count;
            mostReviewedApp = app;
        }
    }

    if (!mostReviewedApp) {
        return {
            mostReviewedApp: null,
            mostReviews: 0,
            mostUsedDevice: null,
            mostDevices: 0,
            avgRating: 0.0,
        };
    }

    const deviceCounts = new Map();
    let ratingSum = 0;
    let ratingCount = 0;

    for (const row of cleaned) {
        if (row.app_name === mostReviewedApp) {
            const device = row.device_type;
            deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
            ratingSum += Number(row.rating);
            ratingCount++;
        }
    }

    let mostUsedDevice = null;
    let mostDevices = 0;
    for (const [device, count] of deviceCounts.entries()) {
        if (count > mostDevices) {
            mostDevices = count;
            mostUsedDevice = device;
        }
    }

    let avgRating;
    if (ratingCount === 0) {
        avgRating = 0.0;
    } else {
        avgRating = Number((ratingSum / ratingCount).toFixed(3));
    }

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment
};
