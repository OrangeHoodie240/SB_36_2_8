process.env.NODE_ENV = 'test'; 
const db = require('./db'); 
const request = require('supertest');
const app = require('./app'); 


afterAll(async ()=>{
    await db.end(); 
});

afterEach(async ()=>{
    await db.query('DELETE FROM books'); 

});

beforeEach(async ()=>{
    await db.query(`INSERT INTO books(isbn, amazon_url, author, language, pages, publisher, title, year)
                    VALUES('131393901', 'https://amazon.com/test1', 'Don Shaw', 'en', 300, 'Hero Publishers', 'How To Be A Hero', 2021), 
                          ('390390131', 'https://amazon.com/test2', 'Corey Lowe', 'en', 400, 'Beardsman Publishers', 'How To Art', 2021)`);

    BOOK_OBJ = {
        'isbn': '19292921', 
        'amazon_url': 'https://amazon.com/test3', 
        'author': 'Trebek', 
        'language': 'en', 
        'pages': 500, 
        'publisher': 'Super Pub', 
        'title': 'Super Book', 
        'year': 2021
    };
});


describe('test GET routes', ()=>{

    test('gets book by isbn', async ()=>{
        const resp = await request(app).get('/books/131393901'); 
        expect(resp.body.book.title).toEqual('How To Be A Hero');
        expect(resp.statusCode).toEqual(200);
    });
    test('gets all books', async ()=>{
       const resp = await request(app).get('/books');
       const books = resp.body.books; 
       expect(books.length).toEqual(2); 
       expect(new Set([books[0].title, books[1].title])).toEqual(new Set(['How To Be A Hero', 'How To Art'])); 
       expect(resp.statusCode).toEqual(200); 
    });
});

describe('test DELETE route', ()=>{
    test('it deletes', async ()=>{
        let beforeCount = await db.query('SELECT COUNT(*) FROM books'); 
        beforeCount = +(beforeCount.rows[0].count);

        const resp = await request(app).delete('/books/131393901'); 

        let afterCount = await db.query('SELECT COUNT(*) FROM books'); 
        afterCount = +(afterCount.rows[0].count);

        expect(resp.statusCode).toEqual(200); 
        expect(afterCount).toEqual(beforeCount - 1); 
    });
});


describe('test POST route', ()=>{
    test('creates book', async ()=>{
        const resp = await request(app).post('/books').send(BOOK_OBJ); 

        expect(resp.statusCode).toEqual(201); 
        expect(resp.body.book.title).toEqual(BOOK_OBJ.title);
    }); 

    test('validation rejects creating book with a string for year', async ()=>{
        BOOK_OBJ.year = BOOK_OBJ.year + ''; 
        const resp = await request(app).post('/books').send(BOOK_OBJ); 
        
        expect(resp.statusCode).toEqual(400); 
    });

    test('rejects creating book with undefined author', async ()=>{
        BOOK_OBJ.author = undefined; 
        const resp = await request(app).post('/books').send(BOOK_OBJ); 
        expect(resp.statusCode).toEqual(400); 
    });
});


describe('test PUT route', ()=>{
    test('updates book', async ()=>{
        BOOK_OBJ.isbn = '131393901';
        const resp = await request(app).put('/books/131393901').send(BOOK_OBJ); 

        let updatedBook = await db.query(`SELECT title FROM books
                                          WHERE isbn='131393901'`); 
        updatedBook = updatedBook.rows[0]; 

        expect(updatedBook.title).toEqual(BOOK_OBJ.title);
        expect(resp.statusCode).toEqual(200);
    });

    test('validator rejects update when isbn is number', async ()=>{
        let book = await db.query(`SELECT * FROM books 
                                   WHERE isbn='131393901'`); 
        book = book.rows[0]; 
        book.isbn = +(book.isbn); 

        const resp = await request(app).put('/books/131393901').send(book); 

        expect(resp.statusCode).toEqual(400);
    });
});
