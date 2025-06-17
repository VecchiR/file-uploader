function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024; // 1000 for decimal, 1024 for binary (using 1024 based on Google Drive's convention. Ubuntu's file manager uses 1000)
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


module.exports = {
    formatFileSize
};