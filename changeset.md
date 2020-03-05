## 示例1

text: "Welcome to Etherpad!↵↵This pad text is synchronized as you type, so that everyone viewing this page sees the same text. This allows you to collaborate seamlessly on documents!↵↵Get involved with Etherpad at http://etherpad.org↵hi↵"

用户操作：`hi`之后输入a

> Changeset: Z:6e>1|5=6b=2*0+1$a
如何理解：
```shell
* 6e>1 字符长度增加1
* |5=6b=2*0+1$ => `=6b`和`=2`分别代表保留的字符长度  `+1`代表字符增加1个 `*0`追加pool的属性
`5`代表 5行
`=6b=2*0` 代表


* $a代表增加的内容
```