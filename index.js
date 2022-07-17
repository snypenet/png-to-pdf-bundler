const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const folder = process.argv[2];
if (!folder){
    console.error('Folder not provided');
    return;
}

if (!fs.existsSync(folder)) {
    console.error('Path does not exist', folder);
    return;
}

createPdf(folder).then(() => {
    console.log('Done!');
});

async function createPdf(folder) {
    const folderName = path.basename(folder);
    const pdfDoc = await PDFDocument.create();
    const files = fs.readdirSync(folder).sort((a, b) => {
        const parsedA = Number(a.replace('.png', ''));
        const parsedB = Number(b.replace('.png', ''));
        return parsedA < parsedB ? -1 : parsedA > parsedB ? 1 : 0;
    });

    for (const file of files) {
        if (file.indexOf('.png') === -1) {
            console.log('Skipping non-PNG', file);
            continue;
        }
        const imageData = fs.readFileSync(path.join(folder, file));
        const embeddedImage = await pdfDoc.embedPng(imageData);
        const page = pdfDoc.addPage();
        page.setRotation(degrees(90));
        const pageHeight = page.getHeight();
        const pageWidth = page.getWidth();
        //make black background
        page.drawRectangle({
            x:0,
            y:0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(0,0,0)
        });
        const scaledDimensions = embeddedImage.scaleToFit(pageHeight, pageWidth);
        page.drawImage(embeddedImage, {
            x: pageWidth / 2 + scaledDimensions.height / 2,
            y: pageHeight / 2 - scaledDimensions.width / 2,
            width: scaledDimensions.width,
            height: scaledDimensions.height,
            rotate: degrees(90)
        });

        console.log('Processed', file);
    }

    fs.writeFileSync(path.join(folder, `${folderName}.pdf`), await pdfDoc.save());
}