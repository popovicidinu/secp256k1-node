'use strict'

var expect = require('chai').expect
var BigNum = require('bignum')

var BN = require('../../lib/js/bn')
var util = require('../util')
var bnUtil = require('./util')

describe('BN', function () {
  this.timeout(util.env.repeat * 25)

  before(function () {
    util.setSeed(util.env.seed)
  })

  describe('fromNumber', function () {
    it('0', function () {
      var bn = BN.fromNumber(0)
      bnUtil.testBN(bn, BigNum(0))
    })

    it('2**26-1', function () {
      var bn = BN.fromNumber(0x03ffffff)
      bnUtil.testBN(bn, BigNum(0x03ffffff))
    })

    it('2**26 should equal 0', function () {
      var bn = BN.fromNumber(0x04000000)
      bnUtil.testBN(bn, BigNum(0))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var num = ((b32[0] << 24) + (b32[1] << 16) + (b32[2] << 8) + b32[3]) & 0x03ffffff
      var bn = BN.fromNumber(num)
      bnUtil.testBN(bn, BigNum(num))
    })
  })

  describe('fromBuffer/toBuffer', function () {
    for (var i = 0; i < 10; ++i) {
      it('all bits eq 1 in #' + i + ' word', function () {
        var b32 = bnUtil.fillZeros(BigNum.pow(2, 26).sub(1).shiftLeft(26 * i).toBuffer())
        var bn = BN.fromBuffer(b32)
        bnUtil.testBN(bn, BigNum.fromBuffer(b32))
        expect(bn.toBuffer().toString('hex')).to.equal(b32.toString('hex'))
      })
    }

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var bn = BN.fromBuffer(b32)
      bnUtil.testBN(bn, BigNum.fromBuffer(b32))
      expect(bn.toBuffer().toString('hex')).to.equal(b32.toString('hex'))
    })
  })

  describe.skip('clone', function () {})

  describe('strip', function () {
    it('[0] -> [0]', function () {
      var bn = new BN()
      bn.words = [0]
      bn.length = 1
      bnUtil.testBN(bn.strip(), BigNum(0))
    })

    it('[1] -> [1]', function () {
      var bn = new BN()
      bn.words = [1]
      bn.length = 1
      bnUtil.testBN(bn.strip(), BigNum(1))
    })

    it('[0, 0] -> [0]', function () {
      var bn = new BN()
      bn.words = [0, 0]
      bn.length = 2
      bnUtil.testBN(bn.strip(), BigNum(0))
    })

    it('[1, 0] -> [1]', function () {
      var bn = new BN()
      bn.words = [1, 0]
      bn.length = 2
      bnUtil.testBN(bn.strip(), BigNum(1))
    })
  })

  describe('normSign', function () {
    it('1 -> 1', function () {
      var bn = BN.fromNumber(1)
      bnUtil.testBN(bn.normSign(), BigNum(1))
    })

    it('-1 -> -1', function () {
      var bn = BN.fromNumber(1)
      bn.negative = 1
      bnUtil.testBN(bn.normSign(), BigNum(-1))
    })

    it('0 -> 0', function () {
      var bn = BN.fromNumber(0)
      bnUtil.testBN(bn.normSign(), BigNum(0))
    })

    it('-0 -> 0', function () {
      var bn = BN.fromNumber(0)
      bn.negative = 1
      bnUtil.testBN(bn.normSign(), BigNum(0))
    })

    it('0x04000000 -> 0x04000000', function () {
      var b32 = bnUtil.fillZeros(new Buffer([0xff, 0xff, 0xff, 0xff]))
      var bn = BN.fromBuffer(b32)
      bnUtil.testBN(bn.normSign(), BigNum.fromBuffer(b32))
    })

    it('-0x04000000 -> -0x04000000', function () {
      var b32 = bnUtil.fillZeros(new Buffer([0xff, 0xff, 0xff, 0xff]))
      var bn = BN.fromBuffer(b32)
      bn.negative = 1
      bnUtil.testBN(bn.normSign(), BigNum.fromBuffer(b32).neg())
    })
  })

  describe('isEven', function () {
    it('[0] -> true', function () {
      expect(BN.fromNumber(0).isEven()).to.be.true
    })

    it('[1] -> false', function () {
      expect(BN.fromNumber(1).isEven()).to.be.false
    })
  })

  describe('isOdd', function () {
    it('[0] -> false', function () {
      expect(BN.fromNumber(0).isOdd()).to.be.false
    })

    it('[1] -> true', function () {
      expect(BN.fromNumber(1).isOdd()).to.be.true
    })
  })

  describe('isZero', function () {
    it('[0] -> true', function () {
      expect(BN.fromNumber(0).isZero()).to.be.true
    })

    it('[1] -> false', function () {
      expect(BN.fromNumber(1).isZero()).to.be.false
    })
  })

  describe('ucmp', function () {
    it('a.length > b.length', function () {
      var a = new BN()
      a.length = 2
      var b = new BN()
      b.length = 1
      expect(a.ucmp(b)).to.equal(1)
    })

    it('a.length < b.length', function () {
      var a = new BN()
      a.length = 1
      var b = new BN()
      b.length = 2
      expect(a.ucmp(b)).to.equal(-1)
    })

    it('[2] > [1]', function () {
      var a = BN.fromNumber(2)
      var b = BN.fromNumber(1)
      expect(a.ucmp(b)).to.equal(1)
    })

    it('[1] < [2]', function () {
      var a = BN.fromNumber(1)
      var b = BN.fromNumber(2)
      expect(a.ucmp(b)).to.equal(-1)
    })

    it('[1] = [1]', function () {
      var a = BN.fromNumber(1)
      var b = BN.fromNumber(1)
      expect(a.ucmp(b)).to.equal(0)
    })

    it('-2 > 1', function () {
      var a = BN.fromNumber(2)
      a.negative = 1
      var b = BN.fromNumber(1)
      expect(a.ucmp(b)).to.equal(1)
    })

    it('1 < -2', function () {
      var a = BN.fromNumber(1)
      var b = BN.fromNumber(2)
      b.negative = 1
      expect(a.ucmp(b)).to.equal(-1)
    })

    it('-1 = -1', function () {
      var a = BN.fromNumber(1)
      a.negative = 1
      var b = BN.fromNumber(1)
      b.negative = 1
      expect(a.ucmp(b)).to.equal(0)
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32a = util.getMessage()
      var b32b = util.getTweak()
      var a = BN.fromBuffer(b32a)
      var b = BN.fromBuffer(b32b)
      expect(a.ucmp(b)).to.equal(BigNum.fromBuffer(b32a).cmp(BigNum.fromBuffer(b32b)))
    })
  })

  describe('gtOne', function () {
    it('0', function () {
      var bn = BN.fromNumber(0)
      expect(bn.gtOne()).to.be.false
    })

    it('1', function () {
      var bn = BN.fromNumber(1)
      expect(bn.gtOne()).to.be.false
    })

    it('2', function () {
      var bn = BN.fromNumber(2)
      expect(bn.gtOne()).to.be.true
    })

    it('length > 1', function () {
      var bn = new BN()
      bn.length = 2
      expect(bn.gtOne()).to.be.true
    })
  })

  describe('isOverflow', function () {
    it('0', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(BigNum(0).toBuffer()))
      expect(bn.isOverflow()).to.be.false
    })

    it('n - 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.N.sub(1).toBuffer()))
      expect(bn.isOverflow()).to.be.false
    })

    it('n', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.N.toBuffer()))
      expect(bn.isOverflow()).to.be.true
    })

    it('n + 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.N.add(1).toBuffer()))
      expect(bn.isOverflow()).to.be.true
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var bn = BN.fromBuffer(b32)
      expect(bn.isOverflow()).to.equal(bnUtil.N.cmp(BigNum.fromBuffer(b32)) <= 0)
    })
  })

  describe('isHigh', function () {
    it('0', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(BigNum(0).toBuffer()))
      expect(bn.isHigh()).to.be.false
    })

    it('nh - 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.NH.sub(1).toBuffer()))
      expect(bn.isHigh()).to.be.false
    })

    it('nh', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.NH.toBuffer()))
      expect(bn.isHigh()).to.be.false
    })

    it('nh + 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.NH.add(1).toBuffer()))
      expect(bn.isHigh()).to.be.true
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var bn = BN.fromBuffer(b32)
      expect(bn.isHigh()).to.equal(bnUtil.NH.cmp(BigNum.fromBuffer(b32)) <= 0)
    })
  })

  describe('bitLengthGT256', function () {
    it('length eq 9', function () {
      var bn = new BN()
      bn.length = 9
      expect(bn.bitLengthGT256()).to.be.false
    })

    it('length eq 10 and last word is 0x003fffff', function () {
      var bn = new BN()
      bn.words = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0x003fffff]
      bn.length = 10
      expect(bn.bitLengthGT256()).to.be.false
    })

    it('length eq 10 and last word is 0x00400000', function () {
      var bn = new BN()
      bn.words = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0x00400000]
      bn.length = 10
      expect(bn.bitLengthGT256()).to.be.true
    })

    it('length eq 11', function () {
      var bn = new BN()
      bn.length = 11
      expect(bn.bitLengthGT256()).to.be.true
    })
  })

  describe('iuaddn', function () {
    it('1 + 1', function () {
      var bn = BN.fromNumber(1)
      bnUtil.testBN(bn.iuaddn(1), BigNum(2))
    })

    it('0x03ffffff + 1', function () {
      var bn = BN.fromNumber(0x03ffffff)
      bnUtil.testBN(bn.iuaddn(1), BigNum(0x04000000))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      b32[0] = 0
      var bn = BN.fromBuffer(b32)
      var x = ((b32[1] << 24) + (b32[2] << 16) + (b32[3] << 8) + b32[4]) & 0x03ffffff
      bnUtil.testBN(bn.iuaddn(x), BigNum.fromBuffer(b32).add(x))
    })
  })

  describe('iadd', function () {
    util.repeatIt('random tests', util.env.repeat, function () {
      var b32A = util.getMessage()
      var b32B = util.getTweak()

      var a = BN.fromBuffer(b32A)
      var ac = a.clone()
      var b = BN.fromBuffer(b32B)

      // a + b
      bnUtil.testBN(a.iadd(b), BigNum.fromBuffer(b32A).add(BigNum.fromBuffer(b32B)))
      a.words = ac.clone().words
      a.length = ac.length
      a.negative = 1
      // (-a) + b
      bnUtil.testBN(a.iadd(b), BigNum.fromBuffer(b32A).neg().add(BigNum.fromBuffer(b32B)))
      a.words = ac.clone().words
      a.length = ac.length
      a.negative = 1
      b.negative = 1
      // (-a) + (-b)
      bnUtil.testBN(a.iadd(b), BigNum.fromBuffer(b32A).neg().add(BigNum.fromBuffer(b32B).neg()))
      a.words = ac.clone().words
      a.length = ac.length
      a.negative = 0
      // a + (-b)
      bnUtil.testBN(a.iadd(b), BigNum.fromBuffer(b32A).add(BigNum.fromBuffer(b32B).neg()))
    })
  })

  describe('add', function () {
    it('source was not affected', function () {
      var b32a = util.getMessage()
      var b32b = util.getTweak()

      var a = BN.fromBuffer(b32a)
      var b = BN.fromBuffer(b32b)

      bnUtil.testBN(a.add(b), BigNum.fromBuffer(b32a).add(BigNum.fromBuffer(b32b)))
      expect(a.toBuffer().toString('hex')).to.equal(b32a.toString('hex'))
    })
  })

  describe('isub', function () {
    util.repeatIt('random tests', util.env.repeat, function () {
      var b32A = util.getMessage()
      var b32B = util.getTweak()

      var a = BN.fromBuffer(b32A)
      var ac = a.clone()
      var b = BN.fromBuffer(b32B)

      // a - b
      bnUtil.testBN(a.isub(b), BigNum.fromBuffer(b32A).sub(BigNum.fromBuffer(b32B)))
      a.words = ac.clone().words
      a.length = ac.length
      a.negative = 1
      // (-a) + b
      bnUtil.testBN(a.isub(b), BigNum.fromBuffer(b32A).neg().sub(BigNum.fromBuffer(b32B)))
      a.words = ac.clone().words
      b.negative = 1
      a.length = ac.length
      // (-a) + (-b)
      bnUtil.testBN(a.isub(b), BigNum.fromBuffer(b32A).neg().sub(BigNum.fromBuffer(b32B).neg()))
      a.words = ac.clone().words
      a.negative = 0
      // a + (-b)
      a.length = ac.length
      bnUtil.testBN(a.isub(b), BigNum.fromBuffer(b32A).sub(BigNum.fromBuffer(b32B).neg()))
    })
  })

  describe('sub', function () {
    it('source was not affected', function () {
      var b32a = util.getMessage()
      var b32b = util.getTweak()

      var a = BN.fromBuffer(b32a)
      var b = BN.fromBuffer(b32b)

      bnUtil.testBN(a.sub(b), BigNum.fromBuffer(b32a).sub(BigNum.fromBuffer(b32b)))
      expect(a.toBuffer().toString('hex')).to.equal(b32a.toString('hex'))
    })
  })

  describe('umul', function () {
    util.repeatIt('random tests', util.env.repeat, function () {
      var b32A = util.getMessage()
      var b32B = util.getTweak()
      var bnR = BigNum.fromBuffer(b32A).mul(BigNum.fromBuffer(b32B))

      var a = BN.fromBuffer(b32A)
      var b = BN.fromBuffer(b32B)
      var r = a.umul(b)

      bnUtil.testBN(r, bnR)
    })
  })

  describe('isplit', function () {
    var tmp = new BN()
    tmp.words = new Array(10)

    it('0 bits', function () {
      var bn = BN.fromNumber(0)
      bn.isplit(tmp)
      bnUtil.testBN(tmp, BigNum(0))
      bnUtil.testBN(bn, BigNum(0))
    })

    it('255 bits', function () {
      var bn = new BN()
      bn.words = [0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x001fffff]
      bn.length = 10
      bn.isplit(tmp)
      bnUtil.testBN(tmp, BigNum(1).shiftLeft(255).sub(1))
      bnUtil.testBN(bn, BigNum(0))
    })

    it('256 bits', function () {
      var bn = new BN()
      bn.words = [0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x003fffff]
      bn.length = 10
      bn.isplit(tmp)
      bnUtil.testBN(tmp, BigNum(1).shiftLeft(256).sub(1))
      bnUtil.testBN(bn, BigNum(0))
    })

    it('257 bits', function () {
      var bn = new BN()
      bn.words = [0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x007fffff]
      bn.length = 10
      bn.isplit(tmp)
      bnUtil.testBN(tmp, BigNum(1).shiftLeft(256).sub(1))
      bnUtil.testBN(bn, BigNum(1))
    })

    it('512 bits', function () {
      var bn = new BN()
      bn.words = [0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff,
                  0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x0003ffff]
      bn.length = 20
      bn.isplit(tmp)
      bnUtil.testBN(tmp, BigNum(1).shiftLeft(256).sub(1))
      bnUtil.testBN(bn, BigNum(1).shiftLeft(256).sub(1))
    })
  })

  describe('fireduce', function () {
    it('n - 1 -> n - 1', function () {
      var bn = BN.fromBuffer(bnUtil.N.sub(1).toBuffer())
      bnUtil.testBN(bn.fireduce(), bnUtil.N.sub(1))
    })

    it('n -> 0', function () {
      var bn = BN.fromBuffer(bnUtil.N.toBuffer())
      bnUtil.testBN(bn.fireduce(), BigNum(0))
    })

    it('2*n - 1 -> n - 1', function () {
      var bn = BN.umulnTo(BN.fromBuffer(bnUtil.N.toBuffer()), 2, BN.fromNumber(0)).isub(BN.fromNumber(1))
      bnUtil.testBN(bn.fireduce(), bnUtil.N.sub(1))
    })

    it('2*n -> n', function () {
      var bn = BN.umulnTo(BN.fromBuffer(bnUtil.N.toBuffer()), 2, BN.fromNumber(0))
      bnUtil.testBN(bn.fireduce(), bnUtil.N)
    })
  })

  describe('ureduce', function () {
    it('n - 1 -> n - 1', function () {
      var bn = BN.fromBuffer(bnUtil.N.sub(1).toBuffer())
      bnUtil.testBN(bn.ureduce(), bnUtil.N.sub(1))
    })

    it('n -> 0', function () {
      var bn = BN.fromBuffer(bnUtil.N.toBuffer())
      bnUtil.testBN(bn.ureduce(), BigNum(0))
    })

    it('n*n - 1 -> n - 1', function () {
      var bn = BN.fromBuffer(bnUtil.N.toBuffer())
      bnUtil.testBN(bn.umul(bn).sub(BN.fromNumber(1)).ureduce(), bnUtil.N.sub(1))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32a = util.getMessage()
      var b32b = util.getTweak()

      var a = BN.fromBuffer(b32a)
      var b = BN.fromBuffer(b32b)

      bnUtil.testBN(a.umul(b).ureduce(), BigNum.fromBuffer(b32a).mul(BigNum.fromBuffer(b32b)).mod(bnUtil.N))
    })
  })

  describe('ishrn', function () {
    it('51 bits eq 1, shift from 0 to 26', function () {
      var b32 = bnUtil.fillZeros(new Buffer('07ffffffffffff', 'hex'))
      for (var i = 0; i < 26; ++i) {
        bnUtil.testBN(BN.fromBuffer(b32).ishrn(i), BigNum.fromBuffer(b32).shiftRight(i))
      }
    })

    it('256 bits eq 1, shift from 0 to 26', function () {
      var b32 = new Buffer(32)
      b32.fill(0xff)
      for (var i = 0; i < 26; ++i) {
        bnUtil.testBN(BN.fromBuffer(b32).ishrn(i), BigNum.fromBuffer(b32).shiftRight(i))
      }
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var shift = b32[0] % 26
      bnUtil.testBN(BN.fromBuffer(b32).ishrn(shift), BigNum.fromBuffer(b32).shiftRight(shift))
    })
  })

  describe('uinvm', function () {
    it('0', function () {
      bnUtil.testBN(BN.fromNumber(0).uinvm(), BigNum(0).invertm(bnUtil.N))
    })

    it('n - 1', function () {
      var b32 = bnUtil.N.sub(1).toBuffer()
      bnUtil.testBN(BN.fromBuffer(b32).uinvm(), BigNum.fromBuffer(b32).invertm(bnUtil.N))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      bnUtil.testBN(BN.fromBuffer(b32).uinvm(), BigNum.fromBuffer(b32).invertm(bnUtil.N))
    })
  })

  describe('redNeg', function () {
    it('0 -> 0', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(BigNum(0).toBuffer()))
      bnUtil.testBN(bn.redNeg(), BigNum(0))
    })

    it('1 -> p - 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(BigNum(1).toBuffer()))
      bnUtil.testBN(bn.redNeg(), bnUtil.P.sub(1))
    })

    it('p - 1 -> 1', function () {
      var bn = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(1).toBuffer()))
      bnUtil.testBN(bn.redNeg(), BigNum(1))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var bn = BN.fromBuffer(util.getMessage())
      if (bn.ucmp(BN.p) >= 0) { bn.redIReduce() }

      bnUtil.testBN(bn.redNeg(), bnUtil.P.sub(BigNum.fromBuffer(bn.toBuffer())))
    })
  })

  describe('redAdd', function () {
    it('(p - 2) + 1 -> p - 1', function () {
      var a = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(2).toBuffer()))
      var b = BN.fromBuffer(bnUtil.fillZeros(BigNum(1).toBuffer()))
      bnUtil.testBN(a.redAdd(b), bnUtil.P.sub(1))
    })

    it('(p - 1) + 1 -> 0', function () {
      var a = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(1).toBuffer()))
      var b = BN.fromBuffer(bnUtil.fillZeros(BigNum(1).toBuffer()))
      bnUtil.testBN(a.redAdd(b), BigNum(0))
    })

    it('(p - 1) + 2 -> 1', function () {
      var a = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(1).toBuffer()))
      var b = BN.fromBuffer(bnUtil.fillZeros(BigNum(2).toBuffer()))
      bnUtil.testBN(a.redAdd(b), BigNum(1))
    })

    it('(p - 1) + (p - 1) -> p - 2', function () {
      var a = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(1).toBuffer()))
      var b = BN.fromBuffer(bnUtil.fillZeros(bnUtil.P.sub(1).toBuffer()))
      bnUtil.testBN(a.redAdd(b), bnUtil.P.sub(2))
    })

    util.repeatIt('random tests', util.env.repeat, function () {
      var a = BN.fromBuffer(util.getMessage())
      var b = BN.fromBuffer(util.getTweak())
      bnUtil.testBN(a.redAdd(b), BigNum.fromBuffer(a.toBuffer()).add(BigNum.fromBuffer(b.toBuffer())).mod(bnUtil.P))
    })
  })

  describe('redMul', function () {
    util.repeatIt('random tests', util.env.repeat, function () {
      var a = BN.fromBuffer(util.getMessage())
      if (a.ucmp(BN.p) >= 0) { a.redIReduce() }
      var b = BN.fromBuffer(util.getTweak())
      if (b.ucmp(BN.p) >= 0) { b.redIReduce() }

      var bnA = BigNum.fromBuffer(a.toBuffer())
      var bnB = BigNum.fromBuffer(b.toBuffer())
      bnUtil.testBN(a.redMul(b), bnA.mul(bnB).mod(bnUtil.P))
    })
  })

  describe('redInvm', function () {
    util.repeatIt('random tests', util.env.repeat, function () {
      var b32 = util.getMessage()
      var a = BN.fromBuffer(b32)
      if (a.ucmp(BN.p) >= 0) { a.redIReduce() }

      bnUtil.testBN(a.redInvm(), BigNum.fromBuffer(a.toBuffer()).invertm(bnUtil.P))
    })
  })
})
