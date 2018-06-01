import { MarshalWith, MarshalFrom, ArrayOf } from 'raynor'
import * as r from 'raynor'

import { Param, Method, Output, Throws } from './annotations'

// We want some things.

// A single point-of-truth class/object which depends on a bunch of entities annotated with Raynor
// Ultimately this can be just a JSON. But it's a bad way to specify things, so something looking
// like a class would be the best.

async function nop<T>(..._args: any[]): Promise<T> {
    throw new Error('Cannot invoke this function directly');
}

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

export class LibraryServiceServer extends LibraryService {
    async getBooks(): Promise<Book[]> {
        return [];
    }

    async updateBook(_bookId: number, _newTitle: string): Promise<Book> {
        return new Book();
    }
}

const ll = new LibraryServiceServer();
console.log((ll as any).__service);
ll.getBooks().then(l => console.log(JSON.stringify(l)));

// A way to build a client object from the point-of-truth class/object. This has a bunch of async
// methods for each one defined there, and allows "almost-local" behaviour. It should be modulated
// by a transport object - a Http/Https type thing. But with other possibilities as well.

// A way to build a server object from the point-of-truth class/object. It should be modulated
// by a transport object - a Http/Https type thing. Possibly Express based.

// TODO: server creation needs to take care that all @Rpc methods are overriden.
