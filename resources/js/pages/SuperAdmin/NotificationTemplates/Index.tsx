import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Search, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NotificationTemplate {
    id: number
    type: string
    action: string
    status: 'on' | 'off'
    template_langs: Array<{
        id: number
        lang: string
        content: string
    }>
}

interface Props {
    notifications: NotificationTemplate[]
}

export default function Index({ notifications }: Props) {
    const { t } = useTranslation()
    
    const [searchTerm, setSearchTerm] = useState('')
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(1)

    const filteredNotifications = notifications.filter(notification =>
        notification.action.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalItems = filteredNotifications.length
    const totalPages = Math.ceil(totalItems / perPage)
    const startIndex = (currentPage - 1) * perPage
    const endIndex = Math.min(startIndex + perPage, totalItems)
    const currentItems = filteredNotifications.slice(startIndex, endIndex)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Notification Templates') }
    ]

    return (
        <PageTemplate 
            title={t('Notification Templates')} 
            url={route('notification-templates.index')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Head title="Notification Templates" />
            
            {/* Search section */}
            <div className="bg-white rounded-lg shadow mb-4">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("Search templates...")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9"
                                    />
                                </div>
                                <Button type="submit" size="sm">
                                    <Search className="h-4 w-4 mr-1.5" />
                                    {t("Search")}
                                </Button>
                            </form>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">{t("Per Page:")}</Label>
                            <Select 
                                value={perPage.toString()} 
                                onValueChange={(value) => {
                                    setPerPage(parseInt(value))
                                    setCurrentPage(1)
                                }}
                            >
                                <SelectTrigger className="w-16 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="px-4 py-3 text-left font-medium text-gray-500">{t('Template Name')}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">{t('Status')}</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((notification: NotificationTemplate) => (
                                <tr key={notification.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{notification.action}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={notification.status === 'on' ? 'default' : 'destructive'}>
                                            {notification.status === 'on' ? t('Active') : t('Inactive')}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => router.visit(route('notification-templates.show', notification.id))}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('View')}</TooltipContent>
                                        </Tooltip>
                                    </td>
                                </tr>
                            ))}
                            
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                        {t('No notification templates found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination section */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {t("Showing")} <span className="font-medium">{startIndex + 1}</span> {t("to")} <span className="font-medium">{endIndex}</span> {t("of")} <span className="font-medium">{totalItems}</span> {t("templates")}
                    </div>
                    
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            Previous
                        </Button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === currentPage ? 'default' : 'outline'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </Button>
                        ))}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </PageTemplate>
    )
}