'use strict';

suite('or', function() {

  test('two parsers', function() {
    var parser = Parsimmon.string('x').or(Parsimmon.string('y'));
    assert.equal(parser.parse('x').value, 'x');
    assert.equal(parser.parse('y').value, 'y');
    assert.ok(!parser.parse('z').status);
  });

  test('with chain', function() {
    var parser = Parsimmon.string('\\')
      .chain(function() {
        return Parsimmon.string('y');
      }).or(Parsimmon.string('z'));
    assert.equal(parser.parse('\\y').value, 'y');
    assert.equal(parser.parse('z').value, 'z');
    assert.ok(!parser.parse('\\z').status);
  });

  test('asserts that a parser was given', function() {
    assert.throws(function() { Parsimmon.string('x').or('not a parser'); });
  });

  test('prefer longest branch', function() {
    var parser =
      Parsimmon.string('abc')
        .then(Parsimmon.string('def'))
        .or(Parsimmon.string('ab').then(Parsimmon.string('cd')));

    assert.deepEqual(parser.parse('abc'), {
      status: false,
      index: {
        offset: 3,
        line: 1,
        column: 4
      },
      expected: ['\'def\'']
    });
  });

  test('prefer last of equal length branches', function() {
    var parser =
      Parsimmon.string('abc')
        .then(Parsimmon.string('def'))
        .or(Parsimmon.string('abc').then(Parsimmon.string('d')));

    assert.deepEqual(parser.parse('abc'), {
      status: false,
      index: {
        offset: 3,
        line: 1,
        column: 4
      },
      expected: ['\'d\'', '\'def\'']
    });
  });

  test('prefer longest branch even after a success', function() {
    var parser =
      Parsimmon.string('abcdef')
        .then(Parsimmon.string('g'))
        .or(Parsimmon.string('ab'))
        .then(Parsimmon.string('cd')).then(Parsimmon.string('xyz'));

    assert.deepEqual(parser.parse('abcdef'), {
      status: false,
      index: {
        offset: 6,
        line: 1,
        column: 7
      },
      expected: ['\'g\'']
    });
  });

  test('prefer longest branch even in a .many()', function() {
    var list = Parsimmon.lazy(function() {
      return atom.or(sexpr).trim(Parsimmon.optWhitespace).many();
    });
    var atom = Parsimmon.regexp(/[^()\s]+/).desc('an atom');
    var sexpr = list.wrap(Parsimmon.string('('), Parsimmon.string(')'));

    assert.deepEqual(
      list.parse('(a b) (c ((() d)))').value,
      [['a', 'b'], ['c', [[[], 'd']]]]
    );

    assert.deepEqual(list.parse('(a b ()) c)'), {
      status: false,
      index: {
        offset: 10,
        line: 1,
        column: 11
      },
      expected: ['\'(\'', 'EOF', 'an atom']
    });

    assert.deepEqual(list.parse('(a (b)) (() c'), {
      status: false,
      index: {
        offset: 13,
        line: 1,
        column: 14
      },
      expected: ['\'(\'', '\')\'', 'an atom']
    });
  });

  test('prefer longest branch in .or() nested in .many()', function() {
    var parser =
      Parsimmon.string('abc')
        .then(Parsimmon.string('def'))
        .or(Parsimmon.string('a'))
        .many();

    assert.deepEqual(
      parser.parse('aaabcdefaa').value,
      ['a', 'a', 'def', 'a', 'a']
    );

    assert.deepEqual(parser.parse('aaabcde'), {
      status: false,
      index: {
        offset: 5,
        line: 1,
        column: 6
      },
      expected: ['\'def\'']
    });
  });

});
