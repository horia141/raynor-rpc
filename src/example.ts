import { MarshalWith, MarshalFrom, ArrayOf } from 'raynor'
import * as r from 'raynor'

import { nop } from './core'
import { Param, Method, Output, Service, Throws } from './annotations'
import { newInMemoryServer, newInMemoryClient } from './worker'

// We want some things.

export class TestBookError extends Error {
    constructor() {
        super('Tried to do something with a test book!');
    }
}

export class Book {
    @MarshalWith(r.IdMarshaller)
    id: number = 0;
    @MarshalWith(r.StringMarshaller)
    title: string = '';
}

@Service
export class LibraryService {
    @Method()
    @Output(ArrayOf(MarshalFrom(Book)))
    async getBooks(): Promise<Book[]> {
        return nop<Book[]>();
    }

    @Method()
    @Output(MarshalFrom(Book))
    @Throws(TestBookError)
    async updateBook(
        @Param(r.IdMarshaller) bookId: number,
        @Param(r.StringMarshaller) newTitle: string): Promise<Book> {
        return nop<Book>(bookId, newTitle);
    }
}

export class LibraryServiceImpl extends LibraryService {
    async getBooks(): Promise<Book[]> {
        return [];
    }

    async updateBook(bookId: number, newTitle: string): Promise<Book> {
        const book = new Book();
        book.id = bookId;
        book.title = newTitle;
        return book;
    }
}

console.log("\n=== Impl ===\n");
const ll = new LibraryServiceImpl();
console.log((ll as any).__service);
//ll.getBooks().then(l => console.log(JSON.stringify(l)));

console.log("\n=== The Server ===\n");
const server = newInMemoryServer(LibraryService, ll);

console.log("\n=== Client ===\n");
const client = newInMemoryClient(LibraryService, server);
client.getBooks().then(bs => console.log(bs) );
client.updateBook(10, 'Hello').then(b => console.log(b));

// A way to build a client object from the point-of-truth class/object. This has a bunch of async
// methods for each one defined there, and allows "almost-local" behaviour. It should be modulated
// by a transport object - a Http/Https type thing. But with other possibilities as well.

// A way to build a server object from the point-of-truth class/object. It should be modulated
// by a transport object - a Http/Https type thing. Possibly Express based.

// TODO: server creation needs to take care that all @Rpc methods are overriden.
