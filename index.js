const request = require('request');
const fs = require('fs');
const jimp = require('jimp');

// Add your tinder auth token here
const tinderAuthToken = 'your-tinder-auth-token';

function unblurImage(blurredImageUrl) {
    return new Promise((resolve, reject) => {
        jimp.read(blurredImageUrl, (err, image) => {
            if (err) reject(err);
            resolve(image);
        });
    });
}

function downloadImage(url, path) {
    return new Promise((resolve, reject) => {
        request.head(url, (err, res, body) => {
            request(url).pipe(fs.createWriteStream(path)).on('close', () => resolve());
        });
    });
}

async function main() {
    try {
        const res = await request({
            url: 'https://api.gotinder.com/v2/recs/core',
            headers: {
                'User-Agent': 'Tinder/7.5.3 (iPhone; iOS 10.3.2; Scale/2.00)',
                'os_version': '22.0.0',
                'app-version': '7.5.3',
                'platform': 'ios',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tinderAuthToken}`
            }
        });

        const recommendations = JSON.parse(res.body);

        if (!recommendations || !recommendations.results) {
            throw new Error('Unexpected API response structure.');
        }

        const likeCount = recommendations.results.length;

        for (let i = 0; i < likeCount; i++) {
            const userId = recommendations.results[i].user._id;
            const userBlurredProfileImageUrl = recommendations.results[i].user.photos[0].processedFiles[0].url;
            const userBlurredProfileImagePath = `./downloads/blurred_${userId}.jpg`;
            const userProfileImagePath = `./downloads/unblurred_${userId}.jpg`;

            await downloadImage(userBlurredProfileImageUrl, userBlurredProfileImagePath);

            // Assuming you want to unblur the image after downloading it
            const unblurredImage = await unblurImage(userBlurredProfileImagePath);
            await unblurredImage.writeAsync(userProfileImagePath);
        }
        console.log("All images downloaded and unblurred successfully!");
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

main();
