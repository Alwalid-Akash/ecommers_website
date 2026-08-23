/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: decimal
 *         stock:
 *           type: integer
 *         category_id:
 *           type: integer
 *         category_name:
 *           type: string
 *         image_url:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     ProductInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         name:
 *           type: string
 *           example: "iPhone 15"
 *         description:
 *           type: string
 *           example: "Latest Apple smartphone"
 *         price:
 *           type: number
 *           example: 999.99
 *         stock:
 *           type: integer
 *           example: 50
 *         category_id:
 *           type: integer
 *           example: 1
 *         image_url:
 *           type: string
 *           example: "https://example.com/iphone.jpg"
 */