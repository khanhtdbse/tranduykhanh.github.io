const HOST_ADDRESS = "n1MPMQgPJVRU8DRLg9eQpXVTbzYPipiuaTb" 

const Errors = {
    INVALID_FINGER: 'Invalid finger!',
    CONSTRACT_NOT_ENOUGH_NAS: 'Constract does not have enough NAS! Wait for fund!'
}

enum FINGERS {
    Rock = 1, 
    Paper, 
    Scissor 
}

enum RESULT {
    Loose = -1,
    Draw = 0,
    Win = 1
}

interface History {
    PlayerAddress: string,
    PlayerFinger: FINGERS,
    ComputerFinger: FINGERS,
    Result: RESULT
}

class Constract {
    constructor() {
        LocalContractStorage.defineMapProperty(this, "Games");
        LocalContractStorage.defineProperty(this, "Size");
    }

    init() {
        this.Size = 0
    }

    play(finger: number) {
        const playerAddress = Blockchain.transaction.from
        const nas = Blockchain.transaction.value
        const constractNas = Blockchain.getAccountState(Blockchain.transaction.to).balance

        if (!this._checkValidFinger(finger)) throw new Error(Errors.INVALID_FINGER)
        if (nas.mul(2).gt(constractNas)) throw new Error(Errors.CONSTRACT_NOT_ENOUGH_NAS)
    
        const computer_finger = this._computerFinger()
        const result = this._compareFinger(finger, computer_finger)
        var game

        switch(result) {
            case RESULT.Draw:
                // Refund
                this._transfer(playerAddress, nas)
                game = this._buildGameMsg(playerAddress, result, nas)
                this._saveGame(game)
                return {
                    result: 'Draw',
                    computer_finger: computer_finger
                }
            case RESULT.Win:
                // Refund and bonus
                this._transfer(playerAddress, nas.mul(2))
                game = this._buildGameMsg(playerAddress, result, nas)
                this._saveGame(game)
                return {
                    result: 'Win',
                    computer_finger: computer_finger
                }
            case RESULT.Loose:
                // Transfer to host
                this._transfer(HOST_ADDRESS, nas)
                game = this._buildGameMsg(playerAddress, result, nas)
                this._saveGame(game)
                return {
                    result: 'Loose',
                    computer_finger: computer_finger
                }
        }
    }

    // Init constract value
    fund() {}

    // Get games history
    getGames() {
        var arr = []
        for (var i = 0; i <= this.Size; i++) {
            arr.push(this.Games.get(i))
        }
        return arr
    }

    _transfer(to: string, amount: number) : Boolean {
        return Blockchain.transfer(to, amount)
    }

    _computerFinger() : FINGERS {
        const computerChoice = Math.random()
        return computerChoice <= 0.33 ? FINGERS.Rock : (computerChoice <= 0.66 ? FINGERS.Paper : FINGERS.Scissor)
    }

    _compareFinger(finger1: FINGERS, finger2: FINGERS) : RESULT {
        if (finger1 === finger2) return RESULT.Draw

        if (finger1 === FINGERS.Rock) {
            if (finger2 === FINGERS.Scissor) {
                return RESULT.Win
            } else {
                return RESULT.Loose
            }
        }
        if (finger1 === FINGERS.Paper) {
            if (finger2 === FINGERS.Rock) {
                return RESULT.Win
            } else {
                return RESULT.Loose
            }
        }
        if (finger1 === FINGERS.Scissor) {
            if (finger2 === FINGERS.Rock) {
                return RESULT.Loose
            } else {
                return RESULT.Win
            }
        }
    }

    _checkValidFinger(finger: number) : Boolean {
        return finger in FINGERS
    }

    _buildGameMsg(playerAddress, status, nas) {
        // Convert w to nas
        nas = nas / 1000000000000000000
        var statusText, nasChange

        switch(status) {
            case RESULT.Draw:
                statusText = 'Draw'
                nasChange = "0"
            break
            case RESULT.Win:
                statusText = 'Win'
                nasChange = `+${nas}`
            break
            case RESULT.Loose:
                statusText = 'Loose'
                nasChange = `-${nas}`
            break
        }
        return `Player: ${playerAddress}; Result: ${statusText}; NAS change: ${nasChange}`
    }

    _saveGame(game) {
        this.Games.put(this.Size, game)
        this.Size++
    }
}

module.exports = Constract