# Error Handling

Trong Expressjs có 2 loại handler

## Request handler

Nhận request từ client và trả về response.

Với mỗi request handler thì chúng ta sẽ có 3 tham số là `req`, `res`, `next`.

Nếu không dùng `next` thì không cần khai báo cũng được

```ts
app.get('/users', (req, res, next) => {
  // do something
  res.send('Hello world')
})
```

- Gọi `next()` để chuyển request sang request handler tiếp theo
- Gọi `next(err)` để chuyển request sang error handler tiếp theo

Khi xảy ra lỗi trong synchronous handler thì tự động sẽ được chuyển sang error handler

Khi xảy ra lỗi trong asynchronous handler thì phải gọi `next(err)` để chuyển sang error handler

## Error handler

Nhận error từ request handler và trả về response

Với mỗi error handler thì chúng ta bắt **buộc phải khai báo đủ có 4 tham số** là `err`, `req`, `res`, `next`.

Nếu chỉ khai báo 3 tham số thì nó sẽ được coi là request handler

```ts
app.use((err, req, res, next) => {
  if (err) {
    // do something
    res.status(400).send('Error')
  }
})
```

## Flow nên làm

Tất cả các lỗi nên được đưa về hết một chỗ để xử lý và trả về cho người dùng.

Chúng ta gọi chỗ đó là default error handler và nó sẽ được đặt ở cấp độ app

## Format lỗi trả về cho người dùng

Chúng ta nên thống nhất format lỗi trả về cho người dùng

Lỗi thường

```ts
{
  message: string
  error_info?: any
}
```

Lỗi validation (422)

```ts
{
  message: string,
  errors: {
    [field: string]: {
      msg: string
      [key: string]: any
    }
  }
}
```
