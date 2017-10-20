describe("Parser", function() {
  var Parser = require('../parser.js');
  var p;

  beforeEach(function() {
    p = new Parser();
  });

  describe("getIncomingMessageLength()", function(){
      it("should be able to get length of the empty message", function() {
        expect(p.getIncomingMessageLength('')).toEqual(0);
      });

      it("should be able to parse the message length 1", function() {
        expect(p.getIncomingMessageLength('\x00\x01x')).toEqual(1);
      });

      it("should be able to parse the message length 10", function() {
        expect(p.getIncomingMessageLength('\x00\x0ax')).toEqual(10);
      });

      it("should be able to parse the message length 255", function() {
        expect(p.getIncomingMessageLength('\x00\xffx')).toEqual(255);
      });

      it("should be able to parse the message length 256", function() {
        expect(p.getIncomingMessageLength('\x01\x00x')).toEqual(256);
      });

      it("should be able to parse the message length 43981", function() {
        expect(p.getIncomingMessageLength('\xab\xcdx')).toEqual(43981);
      });

      it("should be able to parse the message length 65535", function() {
        expect(p.getIncomingMessageLength('\xff\xffx')).toEqual(65535);
      });
  });

  describe("parse())", function(){
      it("should be able to parse 'Go out of service' message", function() {
        var parsed = { 
          message_class: 'Terminal Command', 
          LUNO: '000', 
          message_sequence_number: '000', 
          command_code: 'Go out-of-service' 
        };
        expect(p.parse('10\x1c000\x1c000\x1c2', 12)).toEqual(parsed);
      });

      it("should be able to parse 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '133', 
          notes_to_dispense: '',
          transaction_serial_number: '0775', 
          function_identifier: { 
            '9': 'Display and print' 
          }, 
          screen_number: '064', 
          message_coordination_number: '2', 
          card_return_flag: {
            '0': 'Return card during the Close state',
          }
        };
        expect(p.parse('40\x1c000\x1c\x1c133\x1c\x1c07759064\x1c200', 25)).toEqual(parsed);
      });

      it("should be able to parse Receipt Printer Data field in 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '142', 
          notes_to_dispense: '',
          transaction_serial_number: '2835',
          function_identifier: { 5: 'Set next state and print' },
          screen_number: '025',
          message_coordination_number: 'G',
          card_return_flag: { 0: 'Return card during the Close state' },
          receipt_printer_data: 'RECEIPT PRINTER DATA',
        };
        expect(p.parse('40\x1c000\x1c\x1c142\x1c\x1c28355025\x1cG02RECEIPT PRINTER DATA')).toEqual(parsed);
      });

      it("should be able to parse Journal Printer Data field in 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '142', 
          notes_to_dispense: '',
          transaction_serial_number: '2835',
          function_identifier: { 5: 'Set next state and print' },
          screen_number: '025',
          message_coordination_number: 'G',
          card_return_flag: { 0: 'Return card during the Close state' },
          journal_printer_data: 'JOURNAL PRINTER DATA',
        };
        expect(p.parse('40\x1c000\x1c\x1c142\x1c\x1c28355025\x1cG01JOURNAL PRINTER DATA')).toEqual(parsed);
      });

      it("should be able to parse Receipt and Journal Printer Data fields in 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '142', 
          notes_to_dispense: '',
          transaction_serial_number: '2835',
          function_identifier: { 5: 'Set next state and print' },
          screen_number: '025',
          message_coordination_number: 'G',
          card_return_flag: { 0: 'Return card during the Close state' },
          receipt_printer_data: 'RECEIPT PRINTER DATA',
          journal_printer_data: 'JOURNAL PRINTER DATA',
        };
        expect(p.parse('40\x1c000\x1c\x1c142\x1c\x1c28355025\x1cG02RECEIPT PRINTER DATA\x1d1JOURNAL PRINTER DATA')).toEqual(parsed);
      });

      it("should be able to parse 'print on receipt and journal printer' flag in 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '142', 
          notes_to_dispense: '',
          transaction_serial_number: '2835',
          function_identifier: { 5: 'Set next state and print' },
          screen_number: '025',
          message_coordination_number: 'G',
          card_return_flag: { 0: 'Return card during the Close state' },
          receipt_printer_data: 'RECEIPT PRINTER AND JOURNAL PRINTER DATA',
          journal_printer_data: 'RECEIPT PRINTER AND JOURNAL PRINTER DATA',
        };
        expect(p.parse('40\x1c000\x1c\x1c142\x1c\x1c28355025\x1cG03RECEIPT PRINTER AND JOURNAL PRINTER DATA')).toEqual(parsed);
      });

      it("should be able to parse 'print on receipt and journal printer' flag in 'Transaction reply' message", function() {
        var parsed = { 
          message_class: 'Transaction Reply Command', 
          LUNO: '000', 
          message_sequence_number: '', 
          next_state: '142', 
          notes_to_dispense: '',
          transaction_serial_number: '2880',
          function_identifier: { 5: 'Set next state and print' },
          screen_number: '025',
          screen_display_update: 'u09621000\x1d0000078SCREEN DATA'
        };
        expect(p.parse('40\x1c000\x1c\x1c142\x1c\x1c28805025u09621000\x1d0000078SCREEN DATA')).toEqual(parsed);
      });
  });  

  describe("parseDataCommands - Load States", function(){
    it("should be able to parse 'Interactive Transaction Response' message", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Interactive Transaction Response', 
        display_flag: '1', 
        active_keys: '0110011000', 
        screen_timer_field: '074', 
        screen_data_field: 'SCREENDATA' 
      }
      expect(p.parse('30\x1c000\x1c000\x1c210110011000\x1c074\x1cSCREENDATA')).toEqual(parsed);
    });
  });


  /*
  02 6e 33 30 1c 30 30 30 1c 30 30 30 1c 31 32 1c         .n30.000.000.12.
  30 30 30 41 38 37 30 35 30 30 31 32 38 30 30 32         000A870500128002
  30 30 32 30 30 32 30 30 31 31 32 37 1c 30 30 31         002002001127.001
  4b 30 30 33 30 30 34 30 30 34 31 32 37 31 32 37         K003004004127127
  31 32 37 31 32 37 31 32 37 1c 30 30 32 4a 31 33         127127127.002J13
  32 30 30 30 31 33 32 31 33 36 31 33 32 30 30 30         2000132136132000
  30 38 31 31 37 38 1c 30 30 33 44 30 32 34 30 30         081178.003D02400
  30 31 32 38 30 30 30 30 30 30 30 30 30 30 30 30         0128000000000000
  30 30 30 1c 30 30 34 44 30 32 34 30 30 30 30 30         000.004D02400000
  30 31 32 38 30 30 30 30 30 30 30 30 30 30 30 30         0128000000000000
  1c 30 32 34 42 30 32 34 30 30 32 31 33 31 30 32         .024B02400213102
  36 30 32 36 31 33 38 30 32 36 30 30 33 1c 30 32         6026138026003.02
  36 4b 30 33 31 30 34 33 30 34 30 30 33 31 30 33         6K03104304003103
  31 30 33 31 30 33 31 30 33 31 1c 30 32 37 49 30         1031031031.027I0
  32 35 31 34 36 30 30 31 30 30 30 30 30 31 30 30         2514600100000100
  31 30 30 31 30 30 33 1c 30 33 31 58 30 33 31 30         1001003.031X0310
  30 32 31 33 31 30 33 32 30 33 33 30 31 30 32 35         0213103203301025
  35 30 30 30 1c 30 33 32 57 30 33 34 33 35 32 36         5000.032W0343526
  35 31 31 32 37 32 33 30 30 33 31 35 37 30 31 39         5112723003157019
  31 1c 30 33 33 5a 30 30 30 30 30 30 30 30 30 30         1.033Z0000000000
  30 30 30 30 30 30 30 30 30 30 30 30 30 30 1c 30         00000000000000.0
  33 34 58 30 33 34 30 30 32 31 33 31 30 33 35 30         34X0340021310350
  33 36 30 31 30 32 35 35 30 30 30 1c 30 33 35 57         36010255000.035W
  31 38 31 30 33 37 32 35 35 31 32 37 30 33 31 30         1810372551270310
  33 34 32 35 30 31 38 36 1c 30 33 36 5a 30 30 30         34250186.036Z000
  30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30         0000000000000000
  30 30 30 30 30 1c 30 33 37 58 30 33 37 30 30 32         00000.037X037002
  31 33 31 30 33 38 30 33 39 30 31 30 32 35 35 30         1310380390102550
  30 30 1c 30 33 38 57 32 30 31 31 39 36 33 33 30         00.038W201196330
  32 35 35 30 33 31 33 39 30 33 37 30 30 33 31 1c         255031390370031.
  30 33 39 5a 30 30 30 30 30 30 30 30 30 30 30 30         039Z000000000000
  30 30 30 30 30 30 30 30 30 30 30 30 1c 30 34 30         000000000000.040
  58 30 34 30 30 30 32 31 33 31 30 34 31 30 34 32         X040002131041042
  30 31 30 32 35 35 30 30 30 1c 30 34 31 57 30 34         010255000.041W04
  38 32 37 30 35 37 30 31 32 37 33 35 32 30 34 30         8270570127352040
  30 34 30 30 34 30 1c 30 34 32 5a 30 30 30 30 30         040040.042Z00000
  30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30         0000000000000000
  30 30 30 1c 30 34 33 58 30 34 33 30 30 32 31 33         000.043X04300213
  31 30 34 34 30 34 35 30 31 30 32 35 35 30 30 30         1044045010255000
   */
  describe("parseDataCommands - Load States", function(){
    it("should be able to parse 'Load States' message (single state)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'State Tables load', 
        states: [ '000A870500128002002002001127' ] 
      };
      expect(p.parse('30\x1C000\x1C000\x1C12\x1C000A870500128002002002001127')).toEqual(parsed);
    });

    it("should be able to parse 'Load States' message (multiple states)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'State Tables load',  
        states: [ 
          '000A870500128002002002001127', 
          '001K003004004127127127127127', 
          '002J132000132136132000081178', 
          '003D024000128000000000000000', 
          '004D024000000128000000000000', 
          '024B024002131026026138026003', 
          '026K031043040031031031031031', 
          '027I025146001000001001001003', 
          '031X031002131032033010255000', 
          '032W034352651127230031570191', 
          '033Z000000000000000000000000', 
          '034X034002131035036010255000', 
          '035W181037255127031034250186', 
          '036Z000000000000000000000000', 
          '037X037002131038039010255000', 
          '038W201196330255031390370031', 
          '039Z000000000000000000000000', 
          '040X040002131041042010255000', 
          '041W048270570127352040040040', 
          '042Z000000000000000000000000', 
          '043X043002131044045010255000' 
          ]
        }
      expect(p.parse('3000000012000A870500128002002002001127001K003004004127127127127127002J132000132136132000081178003D024000128000000000000000004D024000000128000000000000024B024002131026026138026003026K031043040031031031031031027I025146001000001001001003031X031002131032033010255000032W034352651127230031570191033Z000000000000000000000000034X034002131035036010255000035W181037255127031034250186036Z000000000000000000000000037X037002131038039010255000038W201196330255031390370031039Z000000000000000000000000040X040002131041042010255000041W048270570127352040040040042Z000000000000000000000000043X043002131044045010255000')).toEqual(parsed);
    });
  });

  describe("parseDataCommands - Load Screens", function(){
    it("should be able to parse 'Load Screens' message (single screen)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'Screen Data load', 
        screens: [ '001SCREENDATA' ] 
      };
      expect(p.parse('3000000011001SCREENDATA')).toEqual(parsed);
    });

    it("should be able to parse 'Load Screens' message (multiple screens)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'Screen Data load',  
        screens: [ 
          '000\x0c\x1bPEPIC000.jpg\x1b\x5c', 
          '002SCREENDATA2', 
          '003SCREENDATA3', 
          ]
        }
      expect(p.parse('3000000011000\x0c\x1bPEPIC000.jpg\x1b\x5c002SCREENDATA2003SCREENDATA3')).toEqual(parsed);
    });
  });

  describe("parseDataCommands - Load FITSs", function(){
    it("should be able to parse 'Load FITs' message (single entry)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'FIT Data load', 
        FITs: [ '000000064000001255255001000132000015000144000000000000000000000000000000000000000000000000000000000' ] 
      };
      expect(p.parse('3000000015000000064000001255255001000132000015000144000000000000000000000000000000000000000000000000000000000')).toEqual(parsed);
    });
    
    it("should be able to parse 'Load FITs' message (multiple entries)", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Customization Command',
        message_identifier: 'FIT Data load', 
        FITs: [ 
          '000000064000001255255001000132000015000144000000000000000000000000000000000000000000000000000000000',
          '001000065007054255255001000132000015000144000000000000000000000000000000000000000000000000000000000',
          '002000065007055255255001000132000015000144000000000000000000000000000000000000000000000000000000000',
          '003000065136037255255001000132000015000144000000000000000000000000000000000000000000000000000000000',
          '004000065136037255255001000132000015000144000000000000000000000000000000000000000000000000000000000',
          '005000065136086255255001000132000015000144000000000000000000000000000000000000000000000000000000000'
          ]
        }
      expect(p.parse('3000000015000000064000001255255001000132000015000144000000000000000000000000000000000000000000000000000000000001000065007054255255001000132000015000144000000000000000000000000000000000000000000000000000000000002000065007055255255001000132000015000144000000000000000000000000000000000000000000000000000000000003000065136037255255001000132000015000144000000000000000000000000000000000000000000000000000000000004000065136037255255001000132000015000144000000000000000000000000000000000000000000000000000000000005000065136086255255001000132000015000144000000000000000000000000000000000000000000000000000000000')).toEqual(parsed);
    });
/*
*/
  });

  describe("parseDataCommands - Extended Encryption Key Information", function(){
    it("should be able to parse 'Extended Encryption Key Information' message", function() {
      var parsed = { 
        message_class: 'Data Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        message_subclass: 'Extended Encryption Key Information', 
        modifier: 'Decipher new comms key with current master key', 
        new_key_length: '030',
        new_key_data: '000000000000000000000000000000000000000000000000',
      }
      /**
       * 00 41 33 30 1c 30 30 30 1c 30 30 30 1c 34 32 1c         .A30.000.000.42.
       * 30 33 30 30 30 30 30 30 30 30 30 30 30 30 30 30         0300000000000000
       * 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30         0000000000000000
       * 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30         0000000000000000
       * 30 30 30                                                000
       */
      expect(p.parse('30\x1c000\x1c000\x1c42\x1c030000000000000000000000000000000000000000000000000')).toEqual(parsed);
    });
  });

  describe("parseHostMessage()", function(){
    it("should be able to parse 'Go out of service' message", function() {
      var parsed = { 
        message_class: 'Terminal Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        command_code: 'Go out-of-service' 
      };
      /*
       *  00 0c 31 30 1c 30 30 30 1c 30 30 30 1c 32               ..10.000.000.2
       */
      expect(p.parseHostMessage('\x00\x0c10\x1c000\x1c000\x1c2')).toEqual(parsed);
    });

    it("should be able to parse 'Send Configuration ID' message", function() {
      var parsed = { 
        message_class: 'Terminal Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        command_code: 'Send Configuration ID' 
      };
      /*
       *  00 0c 31 30 1c 30 30 30 1c 30 30 30 1c 33               ..10.000.000.3
       */
      expect(p.parseHostMessage('\x00\x0c10\x1c000\x1c000\x1c3')).toEqual(parsed);
    });

    it("should be able to parse 'Send supply counters' message", function() {
      var parsed = { 
        message_class: 'Terminal Command', 
        LUNO: '000', 
        message_sequence_number: '000', 
        command_code: 'Send Supply Counters' 
      };
      /*
       *  00 0c 31 30 1c 30 30 30 1c 30 30 30 1c 34               ..10.000.000.4
       */
      expect(p.parseHostMessage('\x00\x0c10\x1c000\x1c000\x1c4')).toEqual(parsed);
    });
  });

  describe('getFunctionIdentifierDescription()', function(){
    it('should parse function identifier 1', function(){
      expect(p.getFunctionIdentifierDescription('1')).toEqual({'1': 'Deposit and print'});
    });

    it('should parse function identifier 2', function(){
      expect(p.getFunctionIdentifierDescription('2')).toEqual({'2': 'Dispense and print'});
    });

    it('should parse function identifier 3', function(){
      expect(p.getFunctionIdentifierDescription('3')).toEqual({'3': 'Display and print'});
    });

    it('should parse function identifier 4', function(){
      expect(p.getFunctionIdentifierDescription('4')).toEqual({'4': 'Print immediate'});
    });

    it('should parse function identifier 5', function(){
      expect(p.getFunctionIdentifierDescription('5')).toEqual({'5': 'Set next state and print'});
    });

    it('should parse function identifier 7', function(){
      expect(p.getFunctionIdentifierDescription('7')).toEqual({'7': 'Deposit and print'});
    });

    it('should parse function identifier 8', function(){
      expect(p.getFunctionIdentifierDescription('8')).toEqual({'8': 'Dispense and print'});
    });

    it('should parse function identifier 9', function(){
      expect(p.getFunctionIdentifierDescription('9')).toEqual({'9': 'Display and print'});
    });

    it('should parse function identifier A', function(){
      expect(p.getFunctionIdentifierDescription('A')).toEqual({'A': 'Eject card and dispense and print (card before cash)'});
    });

    it('should parse function identifier B', function(){
      expect(p.getFunctionIdentifierDescription('B')).toEqual({'B': 'Parallel dispense and print and card eject'});
    });    

    it('should parse function identifier C', function(){
      expect(p.getFunctionIdentifierDescription('C')).toEqual({'C': 'Parallel dispense and print and card eject'});
    });    
  });

  describe('getCardReturnFlagDescription()', function(){
    it('should parse card return flag 0', function(){
      expect(p.getCardReturnFlagDescription('0')).toEqual({'0': 'Return card during the Close state'});
    });

    it('should parse card return flag 1', function(){
      expect(p.getCardReturnFlagDescription('1')).toEqual({'1': 'Retain card during the Close state'});
    });

    it('should parse card return flag 4', function(){
      expect(p.getCardReturnFlagDescription('4')).toEqual({'4': 'Return card while processing the transaction reply'});
    });
  });

  describe('getPrinterFlagDescription()', function(){
    it('should parse printer flag 0', function(){
      expect(p.getPrinterFlagDescription('0')).toEqual({'0': 'Do not print'});
    });

    it('should parse printer flag 1', function(){
      expect(p.getPrinterFlagDescription('1')).toEqual({'1': 'Print on journal printer only'});
    });

    it('should parse printer flag 2', function(){
      expect(p.getPrinterFlagDescription('2')).toEqual({'2': 'Print on receipt printer only'});
    });

    it('should parse printer flag 3', function(){
      expect(p.getPrinterFlagDescription('3')).toEqual({'3': 'Print on receipt and journal printer'});
    });
  });

});
