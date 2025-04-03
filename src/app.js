const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const indexRoutes = require('./routes/index');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

app.use(bodyParser.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
