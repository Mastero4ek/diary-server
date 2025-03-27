class Helpers {
	capitalize = str => {
		if (!str) return ''

		return str.charAt(0).toUpperCase() + str.slice(1)
	}

	async paginate(
		array,
		page = 1,
		limit = 5,
		sort = { type: 'closed_time', value: 'desc' },
		search = ''
	) {
		if (!Array.isArray(array) || page < 1 || limit <= 0)
			throw new Error('Неверные параметры для пагинации')

		// Фильтруем массив по поисковому запросу
		if (search) {
			array = array.filter(item => {
				return Object.values(item).some(
					value =>
						typeof value === 'string' &&
						value.toLowerCase().includes(search.toLowerCase())
				)
			})
		}

		// Сортируем массив по указанному полю и порядку
		array.sort((a, b) => {
			if (
				typeof a[sort.type] === 'string' &&
				typeof b[sort.type] === 'string'
			) {
				// Сортировка по алфавиту
				return sort.value === 'asc'
					? a[sort.type].localeCompare(b[sort.type])
					: b[sort.type].localeCompare(a[sort.type])
			} else if (
				typeof a[sort.type] === 'number' &&
				typeof b[sort.type] === 'number'
			) {
				// Сортировка по числам
				return sort.value === 'asc'
					? a[sort.type] - b[sort.type]
					: b[sort.type] - a[sort.type]
			} else {
				throw new Error('Неподдерживаемый тип данных для сортировки')
			}
		})

		// Вычисляем общее количество страниц
		const totalItems = array.length
		const totalPages = Math.ceil(totalItems / limit)

		// Получаем индекс первого элемента на текущей странице
		const startIndex = (page - 1) * limit

		// Получаем индекс последнего элемента на текущей странице
		const endIndex = Math.min(startIndex + limit, totalItems)

		// Отрезаем нужный сегмент массива
		const itemsOnPage = array.slice(startIndex, endIndex)

		return {
			items: itemsOnPage,
			totalPages,
		}
	}

	async calculateTotalPnl(array) {
		let totalLoss = 0
		let totalProfit = 0

		array.forEach(order => {
			if (order.roe < 0) {
				totalLoss += order.roe
			} else {
				totalProfit += order.roe
			}
		})

		return {
			loss: parseFloat(Number(totalLoss)).toFixed(2),
			profit: parseFloat(Number(totalProfit)).toFixed(2),
		}
	}

	async calculateTotalProfit(array) {
		let totalLoss = 0
		let totalProfit = 0
		let lossCount = 0
		let profitCount = 0

		array.forEach(order => {
			if (order.roe < 0) {
				totalLoss += order.pnl
				lossCount++
			} else {
				totalProfit += order.pnl
				profitCount++
			}
		})

		return {
			loss: parseFloat(Number(totalLoss)).toFixed(2),
			profit: parseFloat(Number(totalProfit)).toFixed(2),
			lossCount: parseFloat(Number(lossCount)),
			profitCount: parseFloat(Number(profitCount)),
		}
	}
}

module.exports = new Helpers()
